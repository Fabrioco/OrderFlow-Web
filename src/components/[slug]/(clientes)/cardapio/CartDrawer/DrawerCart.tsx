import { CartItem, Step } from "@/types/supabase";
import { ArrowRightIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";

export default function DrawerCart({
  cart,
  removeFromCart,
  setStep,
  cartTotal,
  addToCart,
}: {
  setStep: (step: Step) => void;
  cart: CartItem[];
  removeFromCart: (id: string) => void;
  cartTotal: number;
  addToCart: (item: CartItem) => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 items-center p-3 rounded-2xl border border-menu-border/20 bg-menu-bg/50"
          >
            <div className="w-16 h-16 rounded-xl bg-menu-bg flex items-center justify-center text-2xl shrink-0 overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                item.categories?.emoji
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-menu-text text-sm uppercase tracking-tight truncate">
                {item.name}
              </h4>
              <p className="text-menu-accent font-black text-sm mt-0.5">
                {(Number(item.price) * item.quantity).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-menu-surface-deep p-1 rounded-xl border border-menu-border/30">
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-8 h-8 flex items-center justify-center hover:text-menu-accent transition-colors"
              >
                <MinusIcon size={14} weight="bold" />
              </button>
              <span className="text-sm font-black w-5 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => addToCart(item)}
                className="w-8 h-8 flex items-center justify-center hover:text-menu-accent transition-colors"
              >
                <PlusIcon size={14} weight="bold" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-28 bg-menu-footer border-t border-menu-border/20 space-y-4 shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-menu-text-secondary text-xs font-bold uppercase tracking-widest">
            Subtotal
          </span>
          <span className="font-black text-menu-text">
            {cartTotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
        <button
          onClick={() => setStep("info")}
          className="w-full py-4 bg-menu-accent text-menu-accent-on font-black rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(210,187,255,0.2)]"
        >
          Continuar <ArrowRightIcon size={18} weight="bold" />
        </button>
      </div>
    </>
  );
}
