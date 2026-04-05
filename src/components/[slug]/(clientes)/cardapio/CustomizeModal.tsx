import { Addon, Product } from "@/types/supabase";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Dispatch, SetStateAction } from "react";

export default function CustomizeModal({
  customizingProduct,
  setCustomizingProduct,
  addons,
  selectedAddons,
  setSelectedAddons,
  confirmAddToCart
}: {
  customizingProduct: Product | null;
  setCustomizingProduct: (product: Product | null) => void;
  addons: Addon[];
  selectedAddons: Addon[];
  setSelectedAddons: Dispatch<SetStateAction<Addon[]>>;
  confirmAddToCart: () => void;
}) {
  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full bottom-20 z-70 flex items-center justify-center p-4 h-screen">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setCustomizingProduct(null)}
      />
      <div className="relative w-full max-w-lg bg-[#1C1B1B] border border-[#4A4455]/30 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header Modal */}
        <div className="p-6 border-b border-[#4A4455]/20">
          <h3 className="text-xl font-black text-white uppercase italic">
            {customizingProduct?.name}
          </h3>
          <p className="text-xs text-[#CCC3D8] mt-1">
            Turbine seu pedido com adicionais:
          </p>
        </div>

        {/* Lista de Adicionais */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {addons.map((addon) => {
            const isSelected = selectedAddons.some((a) => a.id === addon.id);
            return (
              <button
                key={addon.id}
                onClick={() => {
                  setSelectedAddons((prev) =>
                    isSelected
                      ? prev.filter((a) => a.id !== addon.id)
                      : [...prev, addon],
                  );
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? "border-[#D2BBFF] bg-[#D2BBFF]/5"
                    : "border-[#4A4455]/20 bg-[#131313]/50"
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-white text-sm">
                    {addon.name}
                  </span>
                  <span className="text-[#D2BBFF] text-xs font-black">
                    +{" "}
                    {Number(addon.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#D2BBFF] border-[#D2BBFF]"
                      : "border-[#4A4455]"
                  }`}
                >
                  {isSelected && (
                    <CheckCircleIcon
                      size={16}
                      weight="fill"
                      className="text-[#25005A]"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Modal */}
        <div className="p-6 bg-[#201F1F] border-t border-[#4A4455]/20">
          <button
            onClick={confirmAddToCart}
            className="w-full py-4 bg-[#D2BBFF] text-[#25005A] font-black rounded-2xl flex items-center justify-center gap-3"
          >
            Adicionar à sacola
            <span className="opacity-50 text-xs">•</span>
            {(
              Number(customizingProduct?.price) +
              selectedAddons.reduce((acc, a) => acc + Number(a.price), 0)
            ).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </button>
        </div>
      </div>
    </div>
  );
}
