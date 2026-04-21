"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ReceiptIcon,
  TrendUpIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order } from "@/types/supabase";

/* ── Types ───────────────────────────────────────────────────── */

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

type FilterRange = "hoje" | "7dias" | "30dias" | "custom";

const STATUS_LABEL: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pendente",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  accepted: { label: "Aceito", color: "text-blue-400", bg: "bg-blue-400/10" },
  preparing: {
    label: "Cozinha",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  out_for_delivery: {
    label: "Em Rota",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  delivered: { label: "Entregue", color: "text-success", bg: "bg-success/10" },
  cancelled: { label: "Cancelado", color: "text-danger", bg: "bg-danger/10" },
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  credit_card: "Cartão",
  card_on_delivery: "Cartão na Entrega",
};

/* ── Stat Card ───────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${
        accent ? "bg-accent/5 border-accent/20" : "bg-surface border-border"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-accent/15 text-accent" : "bg-surface-alt text-text-muted"}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
          {label}
        </p>
        <p
          className={`text-xl md:text-2xl font-black tracking-tight leading-tight ${
            // Reduzi um pouco o texto base e adicionei leading-tight
            accent ? "text-accent" : "text-text"
          } break-words`} // Use break-words para garantir que nomes longos não vazem do card
        >
          {value}
        </p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
/* ── Main Page ───────────────────────────────────────────────── */

export default function HistoricoPage() {
  const pathname = usePathname();
  const slug = pathname.split("/")[1];
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterRange>("7dias");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  /* ── Fetch ── */ function StatCard({
    icon,
    label,
    value,
    sub,
    accent = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
  }) {
    return (
      <div
        className={`rounded-2xl border p-5 flex flex-col gap-3 ${
          accent ? "bg-accent/5 border-accent/20" : "bg-surface border-border"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-accent/15 text-accent" : "bg-surface-alt text-text-muted"}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
            {label}
          </p>
          <p
            className={`text-2xl font-black tracking-tight ${
              accent ? "text-accent" : "text-text"
            } wrap-break-word`}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    );
  }

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!tenantData) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), customers(*)")
        .eq("tenant_id", tenantData.id)
        .order("created_at", { ascending: false });

      setOrders((data as Order[]) ?? []);
      setLoading(false);
    }
    if (slug) fetch();
  }, [slug]);

  /* ── Date range ── */
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (filter === "hoje")
      return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now) };
    if (filter === "7dias")
      return {
        rangeStart: startOfDay(subDays(now, 6)),
        rangeEnd: endOfDay(now),
      };
    if (filter === "30dias")
      return {
        rangeStart: startOfDay(subDays(now, 29)),
        rangeEnd: endOfDay(now),
      };
    if (filter === "custom" && customStart && customEnd) {
      return {
        rangeStart: startOfDay(new Date(customStart)),
        rangeEnd: endOfDay(new Date(customEnd)),
      };
    }
    return { rangeStart: startOfDay(subDays(now, 6)), rangeEnd: endOfDay(now) };
  }, [filter, customStart, customEnd]);

  /* ── Filtered orders ── */
  const filtered = useMemo(() => {
    let list = orders.filter((o) =>
      isWithinInterval(new Date(o.created_at), {
        start: rangeStart,
        end: rangeEnd,
      }),
    );
    if (statusFilter !== "all")
      list = list.filter((o) => o.status === statusFilter);
    if (paymentFilter !== "all")
      list = list.filter((o) => o.payment_method === paymentFilter);
    return [...list].sort((a, b) => {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "desc" ? -diff : diff;
    });
  }, [orders, rangeStart, rangeEnd, statusFilter, paymentFilter, sortDir]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const delivered = filtered.filter((o) => o.status === "delivered");
    const cancelled = filtered.filter((o) => o.status === "cancelled");
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const avgTicket = delivered.length ? revenue / delivered.length : 0;
    const topProduct = (() => {
      const counts: Record<string, number> = {};
      delivered.forEach((o) =>
        o.order_items?.forEach((i) => {
          counts[i.product_name] = (counts[i.product_name] ?? 0) + i.quantity;
        }),
      );
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    })();
    const byPayment = filtered.reduce(
      (acc, o) => {
        if (o.status !== "cancelled")
          acc[o.payment_method] = (acc[o.payment_method] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      revenue,
      avgTicket,
      delivered: delivered.length,
      cancelled: cancelled.length,
      topProduct,
      byPayment,
    };
  }, [filtered]);

  const filterLabels: { key: FilterRange; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "7dias", label: "7 dias" },
    { key: "30dias", label: "30 dias" },
    { key: "custom", label: "Período" },
  ];

  function olharnoconsole(text: string) {
    return console.log(text);
  }

  return (
    <main className="min-h-screen bg-bg text-text font-sans relative pb-24">
      <div className="bg-noise pointer-events-none" />

      <section className="lg:ml-64 p-6 md:p-10 relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted mb-4">
            <ReceiptIcon size={12} weight="bold" />
            Histórico
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text">
            Histórico de Pedidos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Analise o desempenho do seu negócio por período.
          </p>
        </header>

        {/* Filtros de período */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                filter === key
                  ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                  : "bg-surface border-border text-text-secondary hover:border-accent/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {filter === "custom" && (
          <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl bg-surface border border-border">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                De
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Até
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
          </div>
        )}

        {/* Mini relatórios */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<CurrencyDollarIcon size={18} weight="bold" />}
              label="Faturamento"
              value={stats.revenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              sub="pedidos entregues"
              accent
            />
            <StatCard
              icon={<TrendUpIcon size={18} weight="bold" />}
              label="Ticket Médio"
              value={stats.avgTicket.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />
            <StatCard
              icon={<CheckCircleIcon size={18} weight="bold" />}
              label="Entregues"
              value={String(stats.delivered)}
              sub={`${stats.cancelled} cancelados`}
            />
            <StatCard
              icon={<ShoppingBagIcon size={18} weight="bold" />}
              label="Mais vendido"
              value={stats.topProduct}
            />
          </div>
        )}

        {/* Formas de pagamento */}
        {!loading && Object.keys(stats.byPayment).length > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-surface border border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">
              Pagamentos no período
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byPayment).map(([method, count]) => (
                <div
                  key={method}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-alt border border-border"
                >
                  <span className="text-xs font-bold text-text-secondary">
                    {PAYMENT_LABEL[method] ?? method}
                  </span>
                  <span className="text-xs font-black text-accent">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros secundários */}
        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
              <FunnelIcon size={14} className="text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-text outline-none"
              >
                <option value="all">Todos os status</option>
                {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-text outline-none"
              >
                <option value="all">Todos os pagamentos</option>
                {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-text-secondary hover:border-accent/40 transition-all"
          >
            {sortDir === "desc" ? (
              <ArrowDownIcon size={14} />
            ) : (
              <ArrowUpIcon size={14} />
            )}
            {sortDir === "desc" ? "Mais recentes" : "Mais antigos"}
          </button>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-text-muted">
            <SpinnerGapIcon size={24} className="animate-spin" />
            <span className="text-sm">Carregando pedidos…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center mx-auto">
              <ReceiptIcon size={28} className="text-text-muted" />
            </div>
            <p className="text-text font-bold">Nenhum pedido no período</p>
            <p className="text-text-muted text-sm">
              Tente mudar o filtro de datas ou status.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const s = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending;
              const isExpanded = expandedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-surface border border-border rounded-2xl overflow-hidden transition-all"
                >
                  {/* Row principal */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-alt/50 transition-all"
                  >
                    {/* Número + data */}
                    <div className="shrink-0 w-14 text-center">
                      <p className="text-xs font-black text-accent">
                        #{order.order_number}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {format(new Date(order.created_at), "dd/MM", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {format(new Date(order.created_at), "HH:mm")}
                      </p>
                    </div>

                    {/* Cliente */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate">
                        {order.customers?.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {order.order_items
                          ?.slice(0, 2)
                          .map((i) => `${i.quantity}x ${i.product_name}`)
                          .join(", ")}
                        {(order.order_items?.length ?? 0) > 2 &&
                          ` +${order.order_items.length - 2}`}
                      </p>
                    </div>

                    {/* Status */}
                    <span
                      className={`hidden sm:flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.color} ${s.bg}`}
                    >
                      {s.label}
                    </span>

                    {/* Pagamento */}
                    <span className="hidden md:block shrink-0 text-xs text-text-muted font-medium">
                      {PAYMENT_LABEL[order.payment_method] ??
                        order.payment_method}
                    </span>

                    {/* Total */}
                    <span className="shrink-0 text-base font-black text-text">
                      {order.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </button>
                  {/* Expandido */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border pt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* ── Cabeçalho de Informações: Cliente e Local ── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coluna: Quem pediu */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                              Cliente
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-surface-alt border border-border flex items-center justify-center text-xs font-bold text-accent">
                                {order.customers?.name?.charAt(0) || "C"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-text">
                                  {order.customers?.name ||
                                    "Cliente não identificado"}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {order.customers?.phone || "Sem telefone"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Se for mesa (Bill) */}
                          {order.bills && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
                                Mesa / Local
                              </p>
                              <p className="text-sm font-bold text-accent">
                                Mesa {order.bills.tables.number}{" "}
                                {order.bills.tables.label &&
                                  `(${order.bills.tables.label})`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Coluna: Endereço ou Tipo de Entrega */}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                            Destino / Entrega
                          </p>
                          {order.delivery_address ? (
                            <div className="text-sm text-text-secondary leading-relaxed">
                              <p className="font-medium text-text">
                                {order.delivery_address.street},{" "}
                                {order.delivery_address.number}
                              </p>
                              <p>
                                {order.delivery_address.neighborhood}
                                {order.delivery_address.city
                                  ? ` - ${order.delivery_address.city}`
                                  : ""}
                              </p>
                              {order.delivery_address.complement && (
                                <p className="text-xs italic text-text-muted">
                                  Ref: {order.delivery_address.complement}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-text-muted italic">
                              Consumo no local ou Retirada
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ── Itens do Pedido com Adicionais ── */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                          Itens e Detalhes
                        </p>
                        <div className="space-y-4">
                          {order.order_items?.map((item) => (
                            <div
                              key={item.id}
                              className="bg-surface-alt/30 p-3 rounded-xl border border-border/50"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-accent/10 text-accent text-[10px] font-black">
                                      {item.quantity}x
                                    </span>
                                    <span className="text-sm font-bold text-text">
                                      {item.product_name}
                                    </span>
                                  </div>

                                  {/* Adicionais do Item */}
                                  {item.selected_addons &&
                                    item.selected_addons.length > 0 && (
                                      <div className="mt-2 ml-8 flex flex-wrap gap-1">
                                        {item.selected_addons.map(
                                          (addon, idx) => (
                                            <span
                                              key={idx}
                                              className="text-[10px] bg-bg border border-border px-1.5 py-0.5 rounded text-text-muted"
                                            >
                                              + {addon.name}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    )}

                                  {/* Observação do Item */}
                                  {item.observation && (
                                    <p className="mt-2 ml-8 text-xs text-amber-500/90 italic flex items-center gap-1">
                                      <ClockIcon size={12} />
                                      Obs item: {item.observation}
                                    </p>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-text-secondary">
                                  {(
                                    item.quantity * item.unit_price
                                  ).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Observação Geral ── */}
                      {order.observation && (
                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">
                            Observação do Pedido
                          </p>
                          <p className="text-sm text-text-secondary italic">
                            "{order.observation}"
                          </p>
                        </div>
                      )}

                      {/* ── Resumo Financeiro ── */}
                      <div className="pt-4 border-t border-border space-y-2">
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>Subtotal</span>
                          <span>
                            {order.subtotal.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>Taxa de entrega</span>
                          <span>
                            {order.delivery_fee.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                              Total Pago via{" "}
                              {PAYMENT_LABEL[order.payment_method] ||
                                order.payment_method}
                            </p>
                            <p className="text-lg font-black text-accent">
                              {order.total.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_LABEL[order.status]?.color} ${STATUS_LABEL[order.status]?.bg}`}
                            >
                              {STATUS_LABEL[order.status]?.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}{" "}
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé com total filtrado */}
        {!loading && filtered.length > 0 && (
          <div className="mt-8 p-5 rounded-2xl bg-surface border border-border flex items-center justify-between">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">
              {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} no
              período
            </span>
            <span className="text-lg font-black text-accent">
              {filtered
                .filter((o) => o.status !== "cancelled")
                .reduce((s, o) => s + o.total, 0)
                .toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
