import { useRouter } from "next/navigation";
import {
  CaretLeftIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  PackageIcon,
  MopedFrontIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Types ───────────────────────────────────────────────────── */

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

const STATUS_MAP: Record<
  OrderStatus,
  { label: string; icon: any; color: string }
> = {
  pending: { label: "Pendente", icon: ClockIcon, color: "text-amber-400" },
  accepted: { label: "Aceito", icon: CheckCircleIcon, color: "text-blue-400" },
  preparing: { label: "Cozinha", icon: PackageIcon, color: "text-purple-400" },
  out_for_delivery: {
    label: "Em Rota",
    icon: MopedFrontIcon,
    color: "text-[#D2BBFF]",
  },
  delivered: {
    label: "Finalizado",
    icon: CheckCircleIcon,
    color: "text-green-400",
  },
  cancelled: { label: "Cancelado", icon: CheckCircleIcon, color: "text-red-400" },
};

/* ── OrdersHeader ────────────────────────────────────────────── */

interface OrdersHeaderProps {
  slug: string | string[];
}

export function OrdersHeader({ slug }: OrdersHeaderProps) {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#353534] px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${slug}`)}
          className="text-[#ccc3d8] hover:text-white transition-colors"
        >
          <CaretLeftIcon size={24} weight="bold" />
        </button>
        <h1 className="font-black italic uppercase tracking-tighter text-lg">
          Histórico de Pedidos
        </h1>
      </div>
      <ReceiptIcon size={24} weight="duotone" className="text-primary opacity-50" />
    </nav>
  );
}

/* ── OrderCard ───────────────────────────────────────────────── */

interface OrderCardProps {
  order: any;
  slug: string | string[];
}

export function OrderCard({ order, slug }: OrderCardProps) {
  const router = useRouter();
  const statusInfo =
    STATUS_MAP[order.status as OrderStatus] ?? STATUS_MAP.pending;
  const Icon = statusInfo.icon;

  return (
    <button
      onClick={() => router.push(`/${slug}/meus-pedidos/${order.id}`)}
      className="w-full bg-[#0e0e0e] rounded-4xl p-6 border border-[#353534] hover:border-[#D2BBFF]/30 transition-all text-left flex flex-col group relative overflow-hidden"
    >
      {/* Status + valor */}
      <div className="flex justify-between items-start mb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D2BBFF] uppercase tracking-[0.2em]">
              #{order.order_number}
            </span>
            <span className="text-[10px] text-[#353534]">•</span>
            <span className="text-[10px] text-[#ccc3d8] font-bold uppercase tracking-widest">
              {format(new Date(order.created_at), "dd MMM, HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
          <div className={`flex items-center gap-1.5 mt-1 ${statusInfo.color}`}>
            <Icon size={16} weight="duotone" />
            <span className="text-xs font-black uppercase italic tracking-tighter">
              {statusInfo.label}
            </span>
          </div>
        </div>
        <span className="text-xl font-black text-white tracking-tighter italic">
          {order.total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>

      {/* Itens */}
      <div className="space-y-2 border-t border-[#353534]/50 pt-4">
        {order.order_items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <span className="text-[#ccc3d8] font-medium">
              <strong className="text-white font-black">
                {item.quantity}x
              </strong>{" "}
              {item.product_name}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-end text-[10px] font-black uppercase tracking-[0.2em] text-[#D2BBFF] group-hover:gap-3 transition-all gap-2">
        Acompanhar Pedido
        <ArrowRightIcon size={14} weight="bold" />
      </div>
    </button>
  );
}

/* ── OrdersEmptyState ────────────────────────────────────────── */

interface OrdersEmptyStateProps {
  slug: string | string[];
}

export function OrdersEmptyState({ slug }: OrdersEmptyStateProps) {
  const router = useRouter();
  return (
    <div className="text-center py-32 space-y-6">
      <div className="size-20 bg-[#1c1b1b] rounded-3xl flex items-center justify-center mx-auto border border-[#353534]">
        <ShoppingBagIcon size={32} weight="duotone" className="text-[#353534]" />
      </div>
      <div>
        <p className="text-white font-bold uppercase italic tracking-tight">
          Nenhum pedido encontrado
        </p>
        <p className="text-[#ccc3d8] text-xs mt-1">
          Seus pedidos aparecerão aqui assim que você finalizar uma compra.
        </p>
      </div>
      <button
        onClick={() => router.push(`/${slug}`)}
        className="px-8 py-3 bg-[#D2BBFF] text-[#25005A] font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all"
      >
        Fazer meu primeiro pedido
      </button>
    </div>
  );
}
