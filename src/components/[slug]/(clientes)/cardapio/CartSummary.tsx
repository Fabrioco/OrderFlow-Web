import { ArrowRightIcon, ShoppingBagIcon } from "@phosphor-icons/react";

export function CartSummary({
  cartCount,
  cartTotal,
  openCart,
  primary_color,
  button_text_color,
}: {
  cartCount: number;
  cartTotal: number;
  openCart: () => void;
  primary_color: string;
  button_text_color: string;
}) {
  const accent = primary_color || "#D2BBFF";
  const textOnAccent = button_text_color || "#ffffff";

  return (
    <div className="fixed bottom-25 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg z-50">
      <button
        onClick={openCart}
        className="w-full h-16 font-black rounded-4xl flex items-center justify-between px-7 active:scale-95 transition-all"
        style={{
          backgroundColor: accent,
          color: textOnAccent,
          boxShadow: `0 20px 50px ${accent}55`, // sombra baseada na cor
        }}
      >
        {/* Lado esquerdo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShoppingBagIcon size={28} weight="bold" />

            <span
              className="absolute -top-1 -right-1 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black"
              style={{
                backgroundColor: textOnAccent,
                color: accent,
              }}
            >
              {cartCount}
            </span>
          </div>

          <span className="text-xs uppercase tracking-widest">Ver sacola</span>
        </div>

        {/* Lado direito */}
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
