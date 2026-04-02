"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  CaretLeft,
  Clock,
  CheckCircle,
  Package,
  MopedFront,
  ArrowRight,
  Receipt,
  ShoppingBag,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── Status Configuration ────────────────────────────────────── */

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

const STATUS_MAP: Record<
  OrderStatus,
  { label: string; icon: any; color: string; bg: string }
> = {
  pending: {
    label: "Pendente",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  accepted: {
    label: "Aceito",
    icon: CheckCircle,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  preparing: {
    label: "Cozinha",
    icon: Package,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  out_for_delivery: {
    label: "Em Rota",
    icon: MopedFront,
    color: "text-[#D2BBFF]",
    bg: "bg-[#D2BBFF]/10",
  },
  delivered: {
    label: "Finalizado",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  cancelled: {
    label: "Cancelado",
    icon: CheckCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
};

export default function MyOrdersPage() {
  const { slug } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealOrders() {
      setLoading(true);
      try {
        // 1. Busca o ID do tenant pelo slug
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", slug)
          .single();

        if (!tenant) return;

        // 2. Busca pedidos reais vinculados a este tenant
        // Ordenado pelo mais recente primeiro
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            id,
            order_number,
            status,
            total,
            created_at,
            order_items (
              product_name,
              quantity
            )
          `,
          )
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealOrders();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D2BBFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-sans pb-20">
      {/* Background Noise Subtle */}
      <div className="fixed inset-0 opacity-[0.01] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Header Minimalista */}
      <nav className="sticky top-0 z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#353534] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${slug}`)}
            className="text-[#ccc3d8] hover:text-white transition-colors"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <h1 className="font-black italic uppercase tracking-tighter text-lg">
            Histórico de Pedidos
          </h1>
        </div>
        <Receipt
          size={24}
          weight="duotone"
          className="text-primary opacity-50"
        />
      </nav>

      <main className="p-6 max-w-2xl mx-auto">
        {orders.length === 0 ? (
          <div className="text-center py-32 space-y-6">
            <div className="size-20 bg-[#1c1b1b] rounded-3xl flex items-center justify-center mx-auto border border-[#353534]">
              <ShoppingBag
                size={32}
                weight="duotone"
                className="text-[#353534]"
              />
            </div>
            <div>
              <p className="text-white font-bold uppercase italic tracking-tight">
                Nenhum pedido encontrado
              </p>
              <p className="text-[#ccc3d8] text-xs mt-1">
                Seus pedidos aparecerão aqui assim que você finalizar uma
                compra.
              </p>
            </div>
            <button
              onClick={() => router.push(`/${slug}`)}
              className="px-8 py-3 bg-[#D2BBFF] text-[#25005A] font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              Fazer meu primeiro pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo =
                STATUS_MAP[order.status as OrderStatus] || STATUS_MAP.pending;
              const Icon = statusInfo.icon;

              return (
                <button
                  key={order.id}
                  onClick={() =>
                    router.push(`/${slug}/meus-pedidos/${order.id}`)
                  }
                  className="w-full bg-[#0e0e0e] rounded-[2rem] p-6 border border-[#353534] hover:border-[#D2BBFF]/30 transition-all text-left flex flex-col group relative overflow-hidden"
                >
                  {/* Status superior */}
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
                      <div
                        className={`flex items-center gap-1.5 mt-1 ${statusInfo.color}`}
                      >
                        <Icon size={16} weight="duotone" />
                        <span className="text-xs font-black uppercase italic tracking-tighter">
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-white tracking-tighter italic">
                        {order.total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Lista de itens compacta */}
                  <div className="space-y-2 border-t border-[#353534]/50 pt-4">
                    {order.order_items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-[#ccc3d8] font-medium">
                          <strong className="text-white font-black">
                            {item.quantity}x
                          </strong>{" "}
                          {item.product_name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer do Card */}
                  <div className="mt-5 flex items-center justify-end text-[10px] font-black uppercase tracking-[0.2em] text-[#D2BBFF] group-hover:gap-3 transition-all gap-2">
                    Acompanhar Pedido
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
