import { Order } from "@/types/supabase";
import { ReceiptIcon } from "@phosphor-icons/react";

export function ResumeSection({ order }: { order: Order }) {
  return (
    <section className="bg-[#0e0e0e] rounded-3xl border border-[#353534] overflow-hidden">
      <div className="p-6 border-b border-[#353534] flex items-center gap-2">
        <ReceiptIcon size={20} weight="bold" className="text-primary" />
        <h3 className="font-black uppercase italic tracking-tight text-sm">
          Resumo do Pedido
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {order.order_items &&
          order.order_items.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex justify-between items-center">
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

              {/* Adicionais renderizados abaixo do nome do produto */}
              {item.selected_addons && item.selected_addons.length > 0 && (
                <div className="pl-9 flex flex-wrap gap-1">
                  {item.selected_addons.map((addon, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded border border-primary/10"
                    >
                      + {addon.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

        <div className="pt-4 border-t border-[#353534] space-y-2">
          <div className="flex justify-between text-xs text-[#ccc3d8] font-bold uppercase tracking-widest">
            <span>Subtotal</span>
            <span>
              {Number(order.subtotal).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#ccc3d8] font-bold uppercase tracking-widest">
            <span>Taxa de Entrega</span>
            <span>
              {Number(order.delivery_fee).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-black uppercase italic">Total</span>
            <span className="text-xl font-black text-primary tracking-tighter">
              {Number(order.total).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
