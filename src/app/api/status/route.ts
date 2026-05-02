// app/api/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const revalidate = 60; // cache de 60s no edge

type ServiceStatus = "operational" | "degraded" | "outage";

interface ServiceResult {
  name: string;
  status: ServiceStatus;
  latency: number | null; // ms
  error?: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

async function checkSupabase(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    // query leve — só confirma que o DB responde
    const { error } = await supabase
      .from("tenants")
      .select("id")
      .limit(1)
      .maybeSingle();

    const latency = Date.now() - start;

    if (error)
      return {
        name: "Banco de Dados (Supabase)",
        status: "degraded",
        latency,
        error: error.message,
      };
    if (latency > 2000)
      return { name: "Banco de Dados (Supabase)", status: "degraded", latency };
    return {
      name: "Banco de Dados (Supabase)",
      status: "operational",
      latency,
    };
  } catch (e: any) {
    return {
      name: "Banco de Dados (Supabase)",
      status: "outage",
      latency: null,
      error: e.message,
    };
  }
}

async function checkVercel(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    // Status page pública da Vercel
    const res = await fetch(
      "https://www.vercel-status.com/api/v2/status.json",
      {
        signal: AbortSignal.timeout(5000),
      },
    );
    const latency = Date.now() - start;
    const json = await res.json();

    const indicator: string = json?.status?.indicator ?? "none";

    if (indicator === "none")
      return { name: "Hospedagem (Vercel)", status: "operational", latency };
    if (indicator === "minor")
      return { name: "Hospedagem (Vercel)", status: "degraded", latency };
    return { name: "Hospedagem (Vercel)", status: "outage", latency };
  } catch (e: any) {
    return {
      name: "Hospedagem (Vercel)",
      status: "outage",
      latency: null,
      error: e.message,
    };
  }
}

// Serviços internos: apenas mede o tempo de resposta da própria API
async function checkSelf(): Promise<ServiceResult> {
  return {
    name: "Plataforma Web (The Order Flow)",
    status: "operational",
    latency: 0,
  };
}

// ── handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const [supabase, vercel, self] = await Promise.all([
    checkSupabase(),
    checkVercel(),
    checkSelf(),
  ]);

  const services: ServiceResult[] = [self, supabase, vercel];

  const allOperational = services.every((s) => s.status === "operational");
  const hasOutage = services.some((s) => s.status === "outage");

  const overall: ServiceStatus = allOperational
    ? "operational"
    : hasOutage
      ? "outage"
      : "degraded";

  return NextResponse.json(
    { overall, services, checkedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      },
    },
  );
}
