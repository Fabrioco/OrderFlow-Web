"use client";

import { createClient } from "@/utils/supabase/client";
import {
  Timer,
  ArrowClockwise,
  Receipt,
  X,
  WhatsappLogo,
  MapPin,
  Bell,
  BellSlash,
  PrinterIcon,
  WifiHigh,
  WifiSlash,
  WifiLow,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { format, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { useSound } from "@/hooks/useSound";
import { Order } from "@/types/supabase";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────── */

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

/* ── Status helpers ──────────────────────────────────────────── */

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  preparing: "Preparo",
  out_for_delivery: "Na entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Aceitar pedido",
  accepted: "Iniciar preparo",
  preparing: "Saiu para entrega",
  out_for_delivery: "Marcar entregue",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10  text-amber-400  border-amber-500/20",
  accepted: "bg-blue-500/10   text-blue-400   border-blue-500/20",
  preparing: "bg-accent/10     text-accent     border-accent/20",
  out_for_delivery: "bg-cyan-500/10   text-cyan-400   border-cyan-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10    text-red-400    border-red-500/20",
};

/* ── Tipos ───────────────────────── */

type ConnectionStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "polling"
  | "failed";

/* ── Constantes ───────────────────── */

const MAX_RETRIES = 6;
const BASE_DELAY = 1000;
const MAX_DELAY = 32000;
const POLLING_INTERVAL = 30000;

/* ── Component ───────────────────────────────────────────────── */

export default function Dashboard() {
  const {
    play: playSound,
    enable: enableSound,
    enabled: soundEnabled,
  } = useSound();
  const { slug } = useParams<{ slug: string }>();
  const { tenant } = useTenant(slug);
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("connecting");

  const tenantId = tenant?.id ?? null;

  // Refs para controlar reconexão sem re-render desnecessário
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);
  const lastEventRef = useRef(Date.now());
  const fetchingRef = useRef(false); // ✅ faltava

  function removeChannel() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }

  function startPolling() {
    if (pollingTimerRef.current) return;

    setConnStatus("polling");

    pollingTimerRef.current = setInterval(() => {
      fetchOrders();
    }, POLLING_INTERVAL);
  }

  const fetchOrders = useCallback(async () => {
    if (!tenantId || fetchingRef.current) return;

    fetchingRef.current = true;

    try {
      const todayStart = startOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
        *,
        customers(name, phone),
        order_items(*),
        bills (
          table_id,
          tables (number, label)
        )
      `,
        )
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStart)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (isMountedRef.current) {
        setOrders((data as Order[]) ?? []);
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    } finally {
      fetchingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, [tenantId, supabase]);
  const subscribeRealtime = useCallback(() => {
    if (!tenantId) return;

    removeChannel();

    const channel = supabase
      .channel(`orders-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          lastEventRef.current = Date.now();
          fetchOrders();
          playSound();
        },
      )
      .subscribe((status, err) => {
        if (!isMountedRef.current) return;

        if (status === "SUBSCRIBED") {
          retryCountRef.current = 0;
          setConnStatus("live");
          stopPolling();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || err) {
          const attempt = retryCountRef.current;

          if (attempt >= MAX_RETRIES) {
            setConnStatus("failed");
            startPolling();
            toast.error("Realtime caiu. Usando polling.");
            return;
          }

          const delay = getRetryDelay(attempt);
          retryCountRef.current++;

          setConnStatus("reconnecting");

          retryTimerRef.current = setTimeout(() => {
            subscribeRealtime();
          }, delay);
        }
      });

    channelRef.current = channel;
  }, [tenantId, fetchOrders, playSound, supabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - lastEventRef.current;

      if (diff > 45000) {
        console.warn("Realtime zumbi detectado");

        retryCountRef.current = 0;
        setConnStatus("reconnecting");

        removeChannel();
        subscribeRealtime();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [subscribeRealtime]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (connStatus === "live") {
        fetchOrders();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [connStatus, fetchOrders]);

  useEffect(() => {
    function offline() {
      setConnStatus("failed");
      startPolling();
    }

    function online() {
      setConnStatus("connecting");
      stopPolling();
      subscribeRealtime();
    }

    window.addEventListener("offline", offline);
    window.addEventListener("online", online);

    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, [subscribeRealtime]);

  useEffect(() => {
    isMountedRef.current = true;

    fetchOrders();
    subscribeRealtime();

    return () => {
      isMountedRef.current = false;

      removeChannel();
      stopPolling();

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [tenantId]);

  function stopPolling() {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }

  /* ── Calcular delay com backoff exponencial + jitter ── */
  function getRetryDelay(attempt: number): number {
    const exp = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY);
    // jitter aleatório de ±20% para evitar thundering herd
    const jitter = exp * 0.2 * (Math.random() * 2 - 1);
    return Math.round(exp + jitter);
  }

  /* ── Update status ── */
  const handleUpdateStatus = useCallback(
    async (orderId: string, currentStatus: OrderStatus) => {
      const next = STATUS_NEXT[currentStatus];
      if (!next) return;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)),
      );

      const { error } = await supabase
        .from("orders")
        .update({ status: next })
        .eq("id", orderId);

      if (error) {
        toast.error("Erro ao atualizar pedido.");
        await fetchOrders();
      } else {
        toast.success(`Pedido ${STATUS_LABEL[next].toLowerCase()}!`);
      }
    },
    [supabase, fetchOrders],
  );

  /* ── Cancel ── */
  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
      );

      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) {
        toast.error("Erro ao cancelar pedido.");
        await fetchOrders();
      } else {
        toast.success("Pedido cancelado.");
      }
    },
    [supabase, fetchOrders],
  );

  /* ── Derived ── */
  const active = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  );
  const done = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status),
  );

  const totalDay = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, order) => {
      const itemsTotal = order.order_items.reduce((sum, item) => {
        const addonsTotal =
          item.selected_addons?.reduce(
            (sum, addon) => sum + Number(addon.price),
            0,
          ) ?? 0;
        return (
          sum + (Number(item.unit_price) + addonsTotal) * Number(item.quantity)
        );
      }, 0);
      return acc + itemsTotal + Number(order.delivery_fee);
    }, 0);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <section className="lg:ml-64 p-8 md:p-12 relative z-10">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Painel de Controle
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text capitalize">
              {tenant?.name} • Pedidos de Hoje
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <StatSmall
              icon={
                <Timer size={20} weight="duotone" className="text-accent" />
              }
              label="Média de Preparo"
              value="12 MIN"
            />

            {/* Indicador de conexão */}
            <ConnectionBadge
              status={connStatus}
              onRetry={() => {
                retryCountRef.current = 0;
                setConnStatus("connecting");
                stopPolling();
                toast.dismiss("realtime-failed");
                subscribeRealtime();
              }}
            />

            <button
              onClick={enableSound}
              disabled={soundEnabled}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                soundEnabled
                  ? "border-accent/30 bg-accent/10 text-accent cursor-default"
                  : "border-border bg-surface text-text-muted hover:border-accent/50 hover:text-accent active:scale-95"
              }`}
            >
              {soundEnabled ? (
                <>
                  <Bell size={16} weight="fill" /> Som ativo
                </>
              ) : (
                <>
                  <BellSlash size={16} weight="duotone" /> Ativar som
                </>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard
            label="Pendentes"
            value={orders
              .filter((o) => o.status === "pending")
              .length.toString()
              .padStart(2, "0")}
          />
          <StatCard
            label="Em Preparo"
            value={orders
              .filter((o) => ["accepted", "preparing"].includes(o.status))
              .length.toString()
              .padStart(2, "0")}
            highlighted
          />
          <StatCard
            label="Na Entrega"
            value={orders
              .filter((o) => o.status === "out_for_delivery")
              .length.toString()
              .padStart(2, "0")}
          />
          <StatCard
            label="Total Hoje"
            value={totalDay.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            isCurrency
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-text">
            Monitor da Cozinha
          </h2>
          <div className="flex items-center gap-2">
            {connStatus === "polling" || connStatus === "failed" ? (
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                Polling 30s
              </span>
            ) : null}
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1.5 px-2 py-1 bg-surface-alt border border-border rounded text-[10px] font-black text-accent uppercase tracking-tighter hover:bg-surface transition-colors"
            >
              <ArrowClockwise className={loading ? "animate-spin" : ""} />{" "}
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {active.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              onCancel={handleCancelOrder}
              slug={slug}
            />
          ))}

          {active.length === 0 && !loading && (
            <div className="col-span-full py-20 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-text-muted">
              <Receipt size={48} weight="thin" className="mb-4 opacity-20" />
              <p className="font-medium tracking-tight">
                Nenhum pedido na fila agora.
              </p>
            </div>
          )}
        </div>

        {done.length > 0 && (
          <>
            <h2 className="text-xl font-bold tracking-tight text-text-secondary mt-16 mb-6">
              Finalizados hoje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {done.slice(0, 9).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onCancel={handleCancelOrder}
                  compact
                  slug={slug}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <PwaInstallBanner />
    </main>
  );
}

/* ── ConnectionBadge ─────────────────────────────────────────── */

function ConnectionBadge({
  status,
  onRetry,
}: {
  status: ConnectionStatus;
  onRetry: () => void;
}) {
  const map: Record<
    ConnectionStatus,
    { icon: React.ReactNode; label: string; cls: string }
  > = {
    connecting: {
      icon: <WifiLow size={14} className="animate-pulse" />,
      label: "Conectando...",
      cls: "border-border text-text-muted bg-surface",
    },
    live: {
      icon: <WifiHigh size={14} />,
      label: "Ao vivo",
      cls: "border-green-500/30 text-green-500 bg-green-500/10",
    },
    reconnecting: {
      icon: <WifiLow size={14} className="animate-pulse" />,
      label: "Reconectando...",
      cls: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    polling: {
      icon: <ArrowClockwise size={14} className="animate-spin" />,
      label: "Modo polling",
      cls: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    failed: {
      icon: <WifiSlash size={14} />,
      label: "Sem conexão",
      cls: "border-red-500/30 text-red-400 bg-red-500/10",
    },
  };

  const { icon, label, cls } = map[status];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${cls}`}
    >
      {icon}
      <span>{label}</span>
      {(status === "failed" || status === "reconnecting") && (
        <button
          onClick={onRetry}
          className="ml-1 underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          Tentar agora
        </button>
      )}
    </div>
  );
}

/* ── OrderCard ───────────────────────────────────────────────── */

function OrderCard({
  order,
  onUpdateStatus,
  onCancel,
  compact = false,
  slug,
}: {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onCancel: (id: string) => void;
  compact?: boolean;
  slug?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isDone = ["delivered", "cancelled"].includes(order.status);
  const hasNext = !!STATUS_NEXT[order.status];
  const whatsapp = `https://wa.me/55${order.customers?.phone.replace(/\D/g, "")}`;

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-[32px] border border-white/10 bg-surface/50 backdrop-blur-md p-5 transition-all duration-300 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5 ${
          compact
            ? "opacity-75 hover:opacity-100 scale-[0.98] hover:scale-100"
            : ""
        }`}
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-accent/10 blur-[60px] transition-opacity group-hover:opacity-100" />

        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase tracking-tighter border border-accent/20">
                #{String(order.order_number).padStart(4, "0")}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                {format(new Date(order.created_at), "HH:mm")}
              </span>
            </div>
            <h3 className="text-lg font-black text-text tracking-tight truncate max-w-[160px]">
              {order.customers?.name ?? "Cliente"}
            </h3>
            {order.bills?.tables && (
              <span className="text-[11px] text-accent font-bold">
                {order.bills.tables.label ??
                  `Mesa ${order.bills.tables.number}`}
              </span>
            )}{" "}
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-2 mb-5">
          {order.order_items?.slice(0, 2).map((item) => {
            const addonsTotal =
              item.selected_addons?.reduce(
                (sum, a) => sum + Number(a.price),
                0,
              ) ?? 0;
            const itemTotal =
              (Number(item.unit_price) + addonsTotal) * Number(item.quantity);
            return (
              <div
                key={item.id}
                className="group/item relative pl-3 border-l-2 border-white/5 hover:border-accent/30 transition-colors"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary font-medium">
                    <b className="text-text mr-1">{item.quantity}x</b>{" "}
                    {item.product_name}
                  </span>
                  <span className="text-[11px] font-mono text-text-muted">
                    R$ {itemTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                {item.selected_addons && item.selected_addons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.selected_addons.map((addon) => (
                      <span
                        key={addon.name}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-text-muted border border-white/5"
                      >
                        +{addon.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {order.order_items?.length > 2 && (
            <p className="text-[10px] text-accent font-bold pl-3 mt-1 tracking-widest uppercase">
              + {order.order_items.length - 2} itens...
            </p>
          )}
        </div>

        {order.delivery_address && !compact && (
          <div className="flex items-center gap-2 mb-5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <MapPin size={14} className="text-accent shrink-0" />
            <span className="text-xs text-text-secondary truncate">
              {order.delivery_address.street}, {order.delivery_address.number}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black tracking-widest text-text-muted">
              Pagamento
            </span>
            <span className="text-xs font-bold text-text-secondary">
              {order.payment_method === "pix" ? "PIX" : "Cartão/Dinheiro"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase font-black tracking-widest text-text-muted block">
              Total
            </span>
            <span className="text-xl font-black text-text tracking-tighter">
              R$ {Number(order.total).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {!compact ? (
          <div className="flex flex-col gap-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDetails(true)}
                className="flex items-center justify-center py-3 rounded-2xl font-bold bg-white/5 border border-white/10 text-text text-xs hover:bg-white/10 transition-all active:scale-95"
              >
                Detalhes
              </button>
              <Link
                href={`/${slug}/painel/print/${order.id}`}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold bg-white/5 border border-white/10 text-text text-xs hover:bg-white/10 transition-all active:scale-95"
              >
                <PrinterIcon size={14} weight="bold" />
                Imprimir
              </Link>
              <div className="col-span-2">
                {hasNext ? (
                  <button
                    onClick={() => onUpdateStatus(order.id, order.status)}
                    className="relative w-full py-3 rounded-2xl font-bold text-xs bg-accent text-menu-text shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 overflow-hidden group/btn"
                  >
                    <span className="relative z-10">
                      {STATUS_ACTION[order.status]}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-2xl font-bold text-[10px] text-center bg-white/5 text-text-muted border border-white/5 uppercase tracking-widest">
                    {STATUS_LABEL[order.status]}
                  </div>
                )}
              </div>
            </div>
            {order.status === "pending" && (
              <button
                onClick={() => onCancel(order.id)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest bg-red-500/5 border border-red-500/10 text-red-500/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all duration-200 active:scale-[0.98] group/cancel"
              >
                <X
                  size={14}
                  weight="bold"
                  className="opacity-50 group-hover/cancel:opacity-100"
                />
                Cancelar Pedido
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowDetails(true)}
            className="w-full py-2 text-[10px] text-center font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
          >
            Expandir Pedido
          </button>
        )}
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          />
          <div className="relative w-full max-w-md bg-surface border-l border-border h-screen p-8 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">
                  Pedido #{String(order.order_number).padStart(4, "0")}
                </p>
                <h2 className="text-2xl font-bold tracking-tighter text-text">
                  Detalhes
                </h2>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-surface-alt rounded-full text-text transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mb-6 p-5 rounded-2xl bg-surface-alt border border-border">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-3">
                Cliente
              </p>
              <h4 className="text-base font-bold text-text">
                {order.customers?.name}
              </h4>
              <p className="text-text-secondary text-sm mb-4">
                {order.customers?.phone}
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-menu-text rounded-lg font-bold text-xs hover:scale-105 transition-all"
              >
                <WhatsappLogo size={16} weight="fill" /> Abrir WhatsApp
              </a>
            </div>

            {order.delivery_address && (
              <div className="mb-6 p-5 rounded-2xl bg-surface-alt border border-border">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                  Endereço
                </p>
                <div className="flex gap-3 text-text">
                  <MapPin size={18} className="text-accent mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">
                      {order.delivery_address.street},{" "}
                      {order.delivery_address.number}
                      {order.delivery_address.complement
                        ? ` — ${order.delivery_address.complement}`
                        : ""}
                    </p>
                    <p className="text-text-secondary">
                      {order.delivery_address.neighborhood}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">
                Itens
              </p>
              <div className="space-y-2">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-border rounded-xl bg-bg/50"
                  >
                    <div className="flex justify-between font-bold text-sm text-text">
                      <span>
                        {item.quantity}× {item.product_name}
                      </span>
                      <span>
                        R${" "}
                        {(item.unit_price * item.quantity)
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    </div>
                    {item.selected_addons?.map((addon) => (
                      <p
                        key={addon.name}
                        className="text-[11px] text-text-secondary mt-1 ml-3"
                      >
                        + {addon.name} · R${" "}
                        {addon.price.toFixed(2).replace(".", ",")}
                      </p>
                    ))}
                    {item.observation && (
                      <p className="text-[11px] text-text-muted italic mt-1 ml-3">
                        "{item.observation}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {order.observation && (
              <div className="mb-6 p-4 rounded-xl border border-border bg-surface-alt">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">
                  Observação
                </p>
                <p className="text-sm text-text-secondary italic">
                  "{order.observation}"
                </p>
              </div>
            )}

            <div className="pt-5 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span>
                  R$ {Number(order.subtotal).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Entrega</span>
                <span>
                  R$ {Number(order.delivery_fee).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-accent pt-3">
                <span>Total</span>
                <span>
                  R$ {Number(order.total).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            {hasNext && (
              <button
                onClick={() => {
                  onUpdateStatus(order.id, order.status);
                  setShowDetails(false);
                }}
                className="w-full mt-8 py-3.5 rounded-2xl font-bold text-sm bg-accent text-menu-text hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
              >
                {STATUS_ACTION[order.status]}
              </button>
            )}
            {order.status === "pending" && (
              <button
                onClick={() => {
                  onCancel(order.id);
                  setShowDetails(false);
                }}
                className="w-full mt-2 py-2.5 rounded-2xl font-bold text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                Recusar pedido
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <div
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </div>
  );
}

function StatSmall({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface border border-border px-4 py-2.5 rounded-xl flex items-center gap-3">
      {icon}
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-text-muted uppercase leading-none mb-1">
          {label}
        </span>
        <span className="text-sm font-bold text-text tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
  isCurrency = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
  isCurrency?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-2xl border border-border bg-surface transition-all ${highlighted ? "border-accent/30 ring-1 ring-accent/10" : ""}`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${highlighted ? "text-accent" : "text-text-muted"}`}
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
