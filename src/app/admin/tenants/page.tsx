"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
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
  phone: string | null;
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

export default function AdminTenantsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

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
    async function fetchTenants() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("tenants")
          .select("id, name, slug, plan, is_open, created_at, city, phone")
          .order("created_at", { ascending: false });
        setTenants((data ?? []) as Tenant[]);
      } catch {
        toast.error("Erro ao carregar tenants.");
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, []);

  /* ── Filtered + paginated ── */
  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.city ?? "").toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || t.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.is_open).length,
    mrr: tenants.reduce((acc, t) => acc + (PLAN_PRICE[t.plan] ?? 0), 0),
  };

  function exportCSV() {
    const rows = [
      ["Nome", "Slug", "Plano", "Status", "Cidade", "Criado em"].join(","),
      ...filtered.map((t) =>
        [
          t.name,
          t.slug,
          t.plan,
          t.is_open ? "Aberto" : "Fechado",
          t.city ?? "",
          format(new Date(t.created_at), "dd/MM/yyyy"),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tenants.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="px-10 py-12">
      {/* Header */}
      <div className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2">
            System Administration
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">
            Tenants
          </h1>
        </div>
        <div className="flex items-center gap-8 text-right">
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">
              Total Ativo
            </p>
            <p className="text-3xl font-bold text-menu-text">
              {stats.total.toString().padStart(2, "0")}
            </p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">
              MRR Estimado
            </p>
            <p className="text-3xl font-bold text-menu-text">
              {stats.mrr.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Bento stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Distribuição por plano */}
        <div className="lg:col-span-2 p-8 rounded-3xl border border-border bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <h3 className="text-sm font-bold text-text mb-6">
            Distribuição por Plano
          </h3>
          <div className="flex items-end gap-3 h-28">
            {Object.entries(PLAN_PRICE).map(([plan, price]) => {
              const count = tenants.filter((t) => t.plan === plan).length;
              const pct = tenants.length ? (count / tenants.length) * 100 : 0;
              return (
                <div
                  key={plan}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-black text-text-muted">
                    {count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-accent/20 hover:bg-accent/40 transition-all cursor-default"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                    {plan}
                  </span>
                  <span className="text-">R$ {price}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Abertura */}
        <div className="p-8 rounded-3xl border border-border bg-surface relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
          <div>
            <h3 className="text-sm font-bold text-text mb-1">
              Estabelecimentos Abertos
            </h3>
            <p className="text-[10px] text-text-muted">
              Percentual com is_open = true
            </p>
          </div>
          <div>
            <p className="text-5xl font-bold tracking-tight text-accent">
              {tenants.length
                ? Math.round((stats.active / tenants.length) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-text-muted mt-2">
              {stats.active} de {tenants.length} abertos agora
            </p>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{
                width: tenants.length
                  ? `${(stats.active / tenants.length) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-surface shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

        {/* Table toolbar */}
        <div className="px-8 py-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-text">
              Diretório de Organizações
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              {filtered.length} de {tenants.length} tenants
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-alt border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all w-48 text-text placeholder:text-text-muted"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="bg-surface-alt border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-accent/50 transition-all text-text"
            >
              <option value="all">Todos os planos</option>
              <option value="free">Free</option>
              <option value="essencial">Essencial</option>
              <option value="basico">Básico</option>
              <option value="pro">Pro</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-alt text-text-muted text-xs font-black uppercase tracking-wider hover:border-accent/50 hover:text-accent transition-all"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <CircleNotchIcon size={28} className="animate-spin text-accent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "Estabelecimento",
                    "Slug",
                    "Plano",
                    "Status",
                    "Cidade",
                    "Telefone",
                    "Criado em",
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
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-16 text-center text-text-muted text-sm"
                    >
                      Nenhum tenant encontrado.
                    </td>
                  </tr>
                ) : (
                  paginated.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="group hover:bg-surface-alt/20 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0">
                            {tenant.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="font-bold text-text text-sm">
                            {tenant.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-accent bg-accent/10 px-2 py-1 rounded-lg">
                          {tenant.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${PLAN_STYLE[tenant.plan] ?? PLAN_STYLE.free}`}
                        >
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase ${tenant.is_open ? "text-emerald-400" : "text-text-muted"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${tenant.is_open ? "bg-emerald-400 animate-pulse" : "bg-text-muted"}`}
                          />
                          {tenant.is_open ? "Aberto" : "Fechado"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {tenant.city ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {tenant.phone ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-text-muted">
                          {format(new Date(tenant.created_at), "dd MMM yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </td>
                      <td className="pr-8 py-4">
                        <button
                          onClick={() =>
                            router.push(`/${tenant.slug}/painel/pedidos`)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-accent hover:underline"
                        >
                          Ver painel
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-8 py-5 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Mostrando{" "}
            <span className="text-text font-bold">
              {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, filtered.length)}
            </span>{" "}
            de {filtered.length} tenants
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              ← Anterior
            </button>
            <span className="text-[11px] text-text-muted px-3">
              {page} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Próximo →
            </button>
          </div>
        </div>
      </div>

      <p className="text-center mt-12 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
        © 2026 The Order Flow Architect • Infraestrutura Segura
      </p>
    </main>
  );
}
