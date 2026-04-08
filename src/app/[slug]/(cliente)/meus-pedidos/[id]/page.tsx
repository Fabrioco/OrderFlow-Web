"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { CaretLeft, Timer, MapPin, WhatsappLogo } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";
import { InfoCard } from "@/components/[slug]/(clientes)/pedidos/[id]/InfoCard";
import { ResumeSection } from "@/components/[slug]/(clientes)/pedidos/[id]/ResumeSection";
import { Order } from "@/types/supabase";
import { STATUS_CONFIG } from "@/constants/status-config";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const pathname = usePathname();
  const { tenant } = useTenant(pathname?.split("/")[1] ?? "");
  const router = useRouter();
  const supabase = createClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("id", id)
        .single();

      if (data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();

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

  function handleWhatsApp() {
    if (!tenant?.phone) return;
    const phone = tenant?.phone.replace(/\D/g, "");
    const message = `Olá, gostaria de saber mais sobre o pedido #${order?.order_number}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

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
            value={`${order.delivery_address.street}, ${order.delivery_address.number} - ${order.delivery_address.neighborhood}`}
            sub={`${order.delivery_address.complement && `- ${order.delivery_address.complement}`}`}
          />
          <InfoCard
            icon={<Timer size={20} className="text-primary" />}
            label="Tempo Estimado"
            value="30-45 min"
            sub="Previsão de chegada"
          />
        </div>

        {/* Resumo dos Itens */}
        <ResumeSection order={order} />
        {/* Botão de Suporte */}
        <button
          type="button"
          className="w-full h-14 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-[#25D366]/20 transition-all"
          onClick={handleWhatsApp}
        >
          <WhatsappLogo size={24} weight="fill" />
          PRECISA DE AJUDA? FALAR NO WHATSAPP
        </button>
      </main>
    </div>
  );
}
