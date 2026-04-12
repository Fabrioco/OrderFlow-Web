"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/* ── Tipos ─────────────────────────────────────────────────── */

export type PlanType = "free" | "essencial" | "pro" | "premium";

type PlanData = {
  plan: PlanType;
  plan_expires_at: string | null;
  trial_started_at: string | null;
  is_blocked: boolean;
};

type UsePlanReturn = {
  plan: PlanType;
  loading: boolean;
  // Dias restantes no trial (null se não for free ou já expirou)
  trialDaysLeft: number | null;
  // true se o trial de 14 dias expirou e o tenant não assinou
  isTrialExpired: boolean;
  // true se o admin bloqueou manualmente o tenant
  isBlocked: boolean;
  // Verifica se o plano atual tem acesso a uma feature
  can: (feature: Feature) => boolean;
};

// Features mapeadas por plano
export type Feature =
  | "cardapio" // todos
  | "painel" // todos
  | "relatorios" // pro + premium
  | "ia" // pro + premium
  | "suporte" // pro + premium
  | "multi_unidade" // premium
  | "funcionarios"; // premium

const PLAN_FEATURES: Record<PlanType, Feature[]> = {
  free: ["cardapio", "painel"],
  essencial: ["cardapio", "painel"],
  pro: ["cardapio", "painel", "relatorios", "ia", "suporte"],
  premium: [
    "cardapio",
    "painel",
    "relatorios",
    "ia",
    "suporte",
    "multi_unidade",
    "funcionarios",
  ],
};

const TRIAL_DAYS = 14;

/* ── Hook ──────────────────────────────────────────────────── */

export function usePlan(slug: string): UsePlanReturn {
  const supabase = createClient();
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    async function fetch() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan, plan_expires_at, trial_started_at, is_blocked")
        .eq("slug", slug)
        .single();
      setData((tenant as PlanData) ?? null);
      setLoading(false);
    }
    fetch();
  }, [slug]);

  if (!data || loading) {
    return {
      plan: "free",
      loading,
      trialDaysLeft: null,
      isTrialExpired: false,
      isBlocked: false,
      can: () => false,
    };
  }

  const plan = data.plan as PlanType;
  const isBlocked = data.is_blocked ?? false;
  const expiresAt = data.plan_expires_at
    ? new Date(data.plan_expires_at)
    : null;
  const trialStarted = data.trial_started_at
    ? new Date(data.trial_started_at)
    : null;

  // Trial expirado: plano free + trial_started_at existe + já passou 14 dias
  // OU plan_expires_at preenchido e já passou
  const now = new Date();

  const isTrialExpired =
    plan === "free" &&
    !!trialStarted &&
    now.getTime() - trialStarted.getTime() > TRIAL_DAYS * 24 * 60 * 60 * 1000;

  // Dias restantes no trial
  let trialDaysLeft: number | null = null;
  if (plan === "free" && trialStarted && !isTrialExpired) {
    const elapsed = Math.floor(
      (now.getTime() - trialStarted.getTime()) / (1000 * 60 * 60 * 24),
    );
    trialDaysLeft = Math.max(0, TRIAL_DAYS - elapsed);
  }

  function can(feature: Feature): boolean {
    if (isBlocked || isTrialExpired) return false;
    return PLAN_FEATURES[plan]?.includes(feature) ?? false;
  }

  return { plan, loading, trialDaysLeft, isTrialExpired, isBlocked, can };
}
