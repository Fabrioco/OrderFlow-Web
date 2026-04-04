"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { OrdersHeader, OrderCard, OrdersEmptyState } from "@/components/[slug]/(clientes)/pedidos";

export default function MyOrdersPage() {
  const { slug } = useParams();
  const supabase = createClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", slug)
          .single();

        if (!tenant) return;

        const { data, error } = await supabase
          .from("orders")
          .select(
            `id, order_number, status, total, created_at, order_items (product_name, quantity)`,
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
    fetchOrders();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D2BBFF]" />
      </div>
    );
  }

  if(!slug) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D2BBFF]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-sans pb-20">
      <div className="fixed inset-0 opacity-[0.01] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <OrdersHeader slug={slug} />

      <main className="p-6 max-w-2xl mx-auto">
        {orders.length === 0 ? (
          <OrdersEmptyState slug={slug} />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} slug={slug} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
