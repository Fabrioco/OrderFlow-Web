import { ArrowRightIcon, ShoppingBagIcon } from "@phosphor-icons/react";

export function CartSummary({
  cartCount,
  cartTotal,
  openCart,
}: {
  cartCount: number;
  cartTotal: number;
  openCart: () => void;
}) {
  return (
    <div className="fixed bottom-25 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg z-50">
      <button
        onClick={openCart}
        className="w-full h-16 bg-menu-accent text-menu-accent-on font-black rounded-4xl flex items-center justify-between px-7 shadow-[0_20px_50px_rgba(210,187,255,0.3)] active:scale-95 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShoppingBagIcon size={28} weight="bold" />
            <span className="absolute -top-1 -right-1 bg-menu-accent-on text-menu-accent text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
              {cartCount}
            </span>
          </div>
          <span className="text-xs uppercase tracking-widest">Ver sacola</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black">
            {cartTotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
          <ArrowRightIcon size={18} weight="bold" />
        </div>
      </button>
    </div>
  );
}
