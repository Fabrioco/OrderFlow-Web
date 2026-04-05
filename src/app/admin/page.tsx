"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Types ───────────────────────────────────────────────────── */

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_open: boolean;
  created_at: string;
  city: string | null;
  _count?: {
    orders: number;
  };
};

type Stats = {
  totalTenants: number;
  activeTenants: number;
  totalOrders: number;
  mrr: number;
};

const PLAN_STYLE: Record<string, string> = {
  free: "bg-surface-alt border-border text-text-muted",
  essencial: "bg-accent/10 border-accent/20 text-accent",
  basico: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  pro: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
};

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  essencial: 19.9,
  basico: 39.9,
  pro: 69.9,
};

/* ── Component ───────────────────────────────────────────────── */

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeTenants: 0,
    totalOrders: 0,
    mrr: 0,
  });
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  /* ── Auth guard — só admin entra ── */
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
        const { data: tenantsData } = await supabase
          .from("tenants")
          .select("id, name, slug, plan, is_open, created_at, city")
          .order("created_at", { ascending: false });

        const { count: ordersCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });

        const list = (tenantsData ?? []) as Tenant[];
        const mrr = list.reduce((acc, t) => acc + (PLAN_PRICE[t.plan] ?? 0), 0);

        setTenants(list);
        setStats({
          totalTenants: list.length,
          activeTenants: list.filter((t) => t.is_open).length,
          totalOrders: ordersCount ?? 0,
          mrr,
        });
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ── Logout ── */
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  /* ── Filtered tenants ── */
  const filtered = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || t.plan === planFilter;
    return matchSearch && matchPlan;
  });

  /* ── Render ── */
  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-200 h-125 bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              SuperAdmin
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">
              Painel Administrativo
            </h1>
            <p className="text-text-secondary text-sm mt-2">
              Visão geral de todos os tenants e métricas da plataforma.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-muted text-xs font-black uppercase tracking-wider hover:border-accent/50 hover:text-accent transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* ── Stats ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <CircleNotchIcon size={32} className="animate-spin text-accent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <StatCard
                label="Total de Tenants"
                value={stats.totalTenants.toString().padStart(2, "0")}
                icon={<BuildingStorefrontIcon className="w-5 h-5" />}
              />
              <StatCard
                label="Tenants Abertos"
                value={stats.activeTenants.toString().padStart(2, "0")}
                icon={<CheckCircleIcon className="w-5 h-5" />}
                highlighted
              />
              <StatCard
                label="Total de Pedidos"
                value={stats.totalOrders.toLocaleString("pt-BR")}
                icon={<ChartBarIcon className="w-5 h-5" />}
              />
              <StatCard
                label="MRR Estimado"
                value={stats.mrr.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
                icon={<CurrencyDollarIcon className="w-5 h-5" />}
                isCurrency
              />
            </div>

            {/* ── Tenants Table ── */}
            <div className="p-8 rounded-3xl border border-border bg-surface shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/40 to-transparent" />

              {/* Table header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-text">
                    Todos os Tenants
                  </h2>
                  <p className="text-text-secondary text-xs mt-1">
                    {filtered.length} de {tenants.length} estabelecimentos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Buscar tenant..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-surface-alt border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all w-52 text-text placeholder:text-text-muted"
                    />
                  </div>

                  {/* Plan filter */}
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-surface-alt border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-accent/50 transition-all text-text"
                  >
                    <option value="all">Todos os planos</option>
                    <option value="free">Free</option>
                    <option value="essencial">Essencial</option>
                    <option value="basico">Básico</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Estabelecimento",
                        "Slug",
                        "Plano",
                        "Status",
                        "Cidade",
                        "Criado em",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pb-4 pr-6 last:pr-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center text-text-muted text-sm"
                        >
                          Nenhum tenant encontrado.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((tenant) => (
                        <tr
                          key={tenant.id}
                          className="group hover:bg-surface-alt/30 transition-colors"
                        >
                          <td className="py-4 pr-6">
                            <p className="font-bold text-text text-sm">
                              {tenant.name}
                            </p>
                          </td>
                          <td className="py-4 pr-6">
                            <code className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-lg">
                              {tenant.slug}
                            </code>
                          </td>
                          <td className="py-4 pr-6">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${PLAN_STYLE[tenant.plan] ?? PLAN_STYLE.free}`}
                            >
                              {tenant.plan}
                            </span>
                          </td>
                          <td className="py-4 pr-6">
                            <div
                              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase ${tenant.is_open ? "text-emerald-400" : "text-text-muted"}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${tenant.is_open ? "bg-emerald-400 animate-pulse" : "bg-text-muted"}`}
                              />
                              {tenant.is_open ? "Aberto" : "Fechado"}
                            </div>
                          </td>
                          <td className="py-4 pr-6">
                            <span className="text-sm text-text-secondary">
                              {tenant.city ?? "—"}
                            </span>
                          </td>
                          <td className="py-4 pr-6">
                            <span className="text-xs text-text-muted">
                              {format(
                                new Date(tenant.created_at),
                                "dd MMM yyyy",
                                { locale: ptBR },
                              )}
                            </span>
                          </td>
                          <td className="py-4">
                            <button
                              onClick={() =>
                                router.push(`/${tenant.slug}/painel/pedidos`)
                              }
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
          </>
        )}

        {/* ── Footer ── */}
        <p className="text-center mt-12 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          © 2026 OrderFlow Architect • Infraestrutura Segura
        </p>
      </div>
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  highlighted = false,
  isCurrency = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlighted?: boolean;
  isCurrency?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-3xl border bg-surface transition-all relative overflow-hidden ${highlighted ? "border-accent/30 ring-1 ring-accent/10" : "border-border"}`}
    >
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/30 to-transparent" />
      <div
        className={`mb-4 ${highlighted ? "text-accent" : "text-text-muted"}`}
      >
        {icon}
      </div>
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${highlighted ? "text-accent" : "text-text-muted"}`}
      >
        {label}
      </p>
      <span
        className={`${isCurrency ? "text-2xl" : "text-4xl"} font-bold tracking-tight ${highlighted ? "text-accent" : "text-text"}`}
      >
        {value}
      </span>
    </div>
  );
}
