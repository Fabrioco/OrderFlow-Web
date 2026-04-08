"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { startOfMonth, subMonths } from "date-fns";

/* ── Types ───────────────────────────────────────────────────── */

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
};

type Order = {
  id: string;
  tenant_id: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  tenants?: { name: string; slug: string };
};

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  essencial: 19.9,
  basico: 39.9,
  pro: 69.9,
};

const PLAN_COLOR: Record<string, string> = {
  free: "bg-border",
  essencial: "bg-accent",
  basico: "bg-blue-400",
  pro: "bg-emerald-400",
};

/* ── Component ───────────────────────────────────────────────── */

export default function AdminRevenuePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  /* ── Auth guard ── */
  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        toast.error("Acesso negado.");
        router.replace("/login");
      }
    }
    checkAdmin();
  }, []);

  /* ── Fetch ── */
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const sixMonthsAgo = subMonths(
          startOfMonth(new Date()),
          5,
        ).toISOString();

        const [{ data: tenantsData }, { data: ordersData }] = await Promise.all(
          [
            supabase.from("tenants").select("id, name, slug, plan"),
            supabase
              .from("orders")
              .select(
                "id, tenant_id, total, status, payment_method, created_at, tenants(name, slug)",
              )
              .gte("created_at", sixMonthsAgo)
              .neq("status", "cancelled")
              .order("created_at", { ascending: false }),
          ],
        );

        setTenants((tenantsData ?? []) as Tenant[]);
        setOrders((ordersData as unknown as Order[]) ?? []);
      } catch {
        toast.error("Erro ao carregar dados de revenue.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ── Computed metrics ── */
  const mrr = tenants.reduce((acc, t) => acc + (PLAN_PRICE[t.plan] ?? 0), 0);
  const gmv = orders.reduce((acc, o) => acc + Number(o.total), 0);

  // Receita por plano
  const revenueByPlan = Object.entries(PLAN_PRICE).map(([plan, price]) => {
    const count = tenants.filter((t) => t.plan === plan).length;
    return { plan, count, revenue: count * price };
  });
  const maxRevenue = Math.max(...revenueByPlan.map((r) => r.revenue), 1);

  // Top tenants por volume de pedidos
  const ordersByTenant = orders.reduce<
    Record<string, { name: string; slug: string; count: number; total: number }>
  >((acc, o) => {
    if (!acc[o.tenant_id]) {
      acc[o.tenant_id] = {
        name: (o.tenants as any)?.name ?? "—",
        slug: (o.tenants as any)?.slug ?? "",
        count: 0,
        total: 0,
      };
    }
    acc[o.tenant_id].count++;
    acc[o.tenant_id].total += Number(o.total);
    return acc;
  }, {});

  const topTenants = Object.values(ordersByTenant)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Pedidos por método de pagamento
  const byMethod = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.payment_method] = (acc[o.payment_method] ?? 0) + 1;
    return acc;
  }, {});

  function exportCSV() {
    const rows = [
      ["Tenant", "Qtd Pedidos", "Volume Total"].join(","),
      ...Object.values(ordersByTenant).map((t) =>
        [t.name, t.count, t.total.toFixed(2)].join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revenue.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="px-10 py-12 flex justify-center pt-40">
        <CircleNotchIcon size={32} className="animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="px-10 py-12">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2">
          Financial Overview
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">
          Revenue Intelligence
        </h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* MRR */}
        <div className="p-8 rounded-3xl border border-border bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <div className="mb-4 text-text-muted">
            <CurrencyDollarIcon className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">
            MRR Estimado
          </p>
          <p className="text-4xl font-bold tracking-tight text-text">
            {mrr.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          <div className="mt-6 w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: "75%" }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2">75% da meta mensal</p>
        </div>

        {/* GMV */}
        <div className="p-8 rounded-3xl border border-border bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <div className="mb-4 text-text-muted">
            <ArrowTrendingUpIcon className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">
            GMV — Últimos 6 Meses
          </p>
          <p className="text-4xl font-bold tracking-tight text-text">
            {gmv.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          <p className="text-xs text-text-muted mt-6">
            {orders.length.toLocaleString("pt-BR")} pedidos processados
          </p>
        </div>

        {/* Ticket médio */}
        <div className="p-8 rounded-3xl border border-accent/30 ring-1 ring-accent/10 bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <div className="mb-4 text-accent">
            <ReceiptPercentIcon className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-3">
            Ticket Médio
          </p>
          <p className="text-4xl font-bold tracking-tight text-accent">
            {orders.length
              ? (gmv / orders.length).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "R$ 0,00"}
          </p>
          <p className="text-xs text-text-muted mt-6">por pedido finalizado</p>
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
        {/* Revenue by plan bar chart */}
        <div className="lg:col-span-3 p-8 rounded-3xl border border-border bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <h3 className="text-base font-bold text-text mb-2">
            Receita por Plano
          </h3>
          <p className="text-[10px] text-text-muted mb-8">
            MRR acumulado por tier de assinatura
          </p>

          <div className="flex items-end gap-4 h-40">
            {revenueByPlan.map(({ plan, count, revenue }) => {
              const pct = maxRevenue ? (revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={plan}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-black text-text-muted">
                    {revenue.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                  <div
                    className="w-full flex flex-col justify-end"
                    style={{ height: "100%" }}
                  >
                    <div
                      className={`w-full rounded-t-xl ${PLAN_COLOR[plan] ?? "bg-border"} opacity-80 hover:opacity-100 transition-opacity`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                      {plan}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {count} tenants
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment methods */}
        <div className="lg:col-span-2 p-8 rounded-3xl border border-border bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <h3 className="text-base font-bold text-text mb-2">
            Métodos de Pagamento
          </h3>
          <p className="text-[10px] text-text-muted mb-6">Últimos 6 meses</p>

          <div className="space-y-4">
            {Object.entries(byMethod)
              .sort(([, a], [, b]) => b - a)
              .map(([method, count]) => {
                const pct = orders.length
                  ? Math.round((count / orders.length) * 100)
                  : 0;
                const label: Record<string, string> = {
                  pix: "PIX",
                  cash: "Dinheiro",
                  credit_card: "Crédito",
                  debit_card: "Débito",
                  not_required: "Presencial",
                  card_on_delivery: "Cartão na Entrega",
                };
                return (
                  <div key={method}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-text">
                        {label[method] ?? method}
                      </span>
                      <span className="text-text-muted">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Top tenants table */}
      <div className="rounded-3xl border border-border bg-surface shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

        <div className="px-8 py-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text">
              Top Tenants por Volume
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              Baseado nos últimos 6 meses
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-alt text-text-muted text-xs font-black uppercase tracking-wider hover:border-accent/50 hover:text-accent transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {[
                  "#",
                  "Estabelecimento",
                  "Pedidos",
                  "Volume Total",
                  "Ticket Médio",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-6 py-4 first:pl-8 last:pr-8"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {topTenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-text-muted text-sm"
                  >
                    Nenhum dado disponível.
                  </td>
                </tr>
              ) : (
                topTenants.map((t, i) => (
                  <tr
                    key={t.slug}
                    className="group hover:bg-surface-alt/20 transition-colors"
                  >
                    <td className="pl-8 pr-4 py-4">
                      <span className="text-sm font-black text-text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="font-bold text-text text-sm">{t.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-text">
                        {t.count.toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-text">
                        {t.total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary">
                        {(t.total / t.count).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </td>
                    <td className="pr-8 py-4">
                      <button
                        onClick={() => router.push(`/${t.slug}/painel/pedidos`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-wider text-accent hover:underline"
                      >
                        Ver painel →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center mt-12 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
        © 2026 OrderFlow Architect • Infraestrutura Segura
      </p>
    </main>
  );
}
