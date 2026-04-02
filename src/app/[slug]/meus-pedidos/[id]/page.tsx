"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  CaretLeft,
  Timer,
  MapPin,
  Receipt,
  WhatsappLogo,
  CheckCircle,
  Package,
  MopedFront,
  Clock,
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

interface Order {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_fee: number;
  payment_method: string;
  created_at: string;
  delivery_address: any;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: any; color: string }
> = {
  pending: {
    label: "Aguardando Confirmação",
    icon: Clock,
    color: "text-amber-400",
  },
  accepted: {
    label: "Pedido Aceito",
    icon: CheckCircle,
    color: "text-blue-400",
  },
  preparing: { label: "Na Cozinha", icon: Package, color: "text-purple-400" },
  out_for_delivery: {
    label: "Saiu para Entrega",
    icon: MopedFront,
    color: "text-primary",
  },
  delivered: { label: "Entregue", icon: CheckCircle, color: "text-green-400" },
  cancelled: { label: "Cancelado", icon: CheckCircle, color: "text-red-400" },
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Busca inicial e Inscrição Realtime
  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `,
        )
        .eq("id", id)
        .single();

      if (data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();

    // Inscrição para mudanças em tempo real apenas deste pedido
    const channel = supabase
      .channel(`order-changes-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Atualiza o estado local com os novos dados do banco
          setOrder((prev) =>
            prev ? { ...prev, ...payload.new } : (payload.new as Order),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  if (!order)
    return (
      <div className="min-h-screen bg-[#131313] text-white p-10">
        Pedido não encontrado.
      </div>
    );

  const StatusIcon = STATUS_CONFIG[order.status].icon;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-sans relative pb-20">
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Header Fixo */}
      <nav className="sticky top-0 z-50 bg-[#131313]/90 backdrop-blur-md border-b border-[#353534] px-6 h-16 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-[#ccc3d8]">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="font-black italic uppercase tracking-tighter text-lg">
          Acompanhar Pedido #{order.order_number}
        </h1>
      </nav>

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Card de Status Principal */}
        <section className="bg-[#0e0e0e] rounded-[2.5rem] p-8 border border-[#353534] text-center space-y-4">
          <div
            className={`mx-auto size-20 rounded-full bg-[#1c1b1b] flex items-center justify-center ${STATUS_CONFIG[order.status].color} shadow-[0_0_40px_rgba(210,187,255,0.1)]`}
          >
            <StatusIcon size={40} weight="duotone" />
          </div>
          <div>
            <h2
              className={`text-2xl font-black uppercase italic tracking-tighter ${STATUS_CONFIG[order.status].color}`}
            >
              {STATUS_CONFIG[order.status].label}
            </h2>
            <p className="text-[#ccc3d8] text-xs font-medium mt-1">
              Atualizado em {format(new Date(), "HH:mm", { locale: ptBR })}
            </p>
          </div>
        </section>

        {/* Detalhes da Entrega */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            icon={<MapPin size={20} className="text-primary" />}
            label="Endereço de Entrega"
            value={`${order.delivery_address.street}, ${order.delivery_address.number}`}
            sub={`${order.delivery_address.neighborhood} - ${order.delivery_address.complement || ""}`}
          />
          <InfoCard
            icon={<Timer size={20} className="text-primary" />}
            label="Tempo Estimado"
            value="30-45 min"
            sub="Previsão de chegada"
          />
        </div>

        {/* Resumo dos Itens */}
        <section className="bg-[#0e0e0e] rounded-3xl border border-[#353534] overflow-hidden">
          <div className="p-6 border-b border-[#353534] flex items-center gap-2">
            <Receipt size={20} weight="bold" className="text-primary" />
            <h3 className="font-black uppercase italic tracking-tight text-sm">
              Resumo do Pedido
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <span className="text-xs font-black text-primary bg-primary/10 size-6 flex items-center justify-center rounded-lg">
                    {item.quantity}x
                  </span>
                  <span className="text-sm font-bold">{item.product_name}</span>
                </div>
                <span className="text-sm font-bold text-[#ccc3d8]">
                  {(item.quantity * item.unit_price).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            ))}

            <div className="pt-4 border-t border-[#353534] space-y-2">
              <div className="flex justify-between text-xs text-[#ccc3d8] font-bold uppercase tracking-widest">
                <span>Subtotal</span>
                <span>
                  {order.subtotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#ccc3d8] font-bold uppercase tracking-widest">
                <span>Taxa de Entrega</span>
                <span>
                  {order.delivery_fee.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-black uppercase italic">
                  Total
                </span>
                <span className="text-xl font-black text-primary tracking-tighter">
                  {order.total.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Botão de Suporte */}
        <button className="w-full h-14 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-[#25D366]/20 transition-all">
          <WhatsappLogo size={24} weight="fill" />
          PRECISA DE AJUDA? FALAR NO WHATSAPP
        </button>
      </main>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-[#0e0e0e] p-5 rounded-3xl border border-[#353534] flex gap-4 items-start">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-sm font-black text-white leading-tight">{value}</p>
        <p className="text-[11px] text-[#ccc3d8] mt-1 font-medium opacity-60">
          {sub}
        </p>
      </div>
    </div>
  );
}
