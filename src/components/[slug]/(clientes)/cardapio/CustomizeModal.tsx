import { Addon, Product } from "@/types/supabase";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Dispatch, SetStateAction } from "react";

export default function CustomizeModal({
  customizingProduct,
  setCustomizingProduct,
  addons,
  selectedAddons,
  setSelectedAddons,
  confirmAddToCart,
  button_text_color,
  primary_color,
}: {
  customizingProduct: Product | null;
  setCustomizingProduct: (product: Product | null) => void;
  addons: Addon[];
  selectedAddons: Addon[];
  setSelectedAddons: Dispatch<SetStateAction<Addon[]>>;
  confirmAddToCart: () => void;
  button_text_color?: string;
  primary_color?: string;
}) {
  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full bottom-20 z-70 flex items-center justify-center p-4 h-screen">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setCustomizingProduct(null)}
      />
      <div className="relative w-full max-w-lg bg-menu-surface border border-menu-border/30 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header Modal */}
        <div className="p-6 border-b border-menu-border/20">
          <h3 className="text-xl font-black text-menu-text uppercase italic">
            {customizingProduct?.name}
          </h3>
          <p className="text-xs text-menu-text-secondary mt-1">
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
                  isSelected ? "" : "border-menu-border/20 bg-menu-bg/50"
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: primary_color,
                        backgroundColor: `${primary_color}15`, // leve transparência
                      }
                    : {}
                }
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-menu-text text-sm">
                    {addon.name}
                  </span>
                  <span
                    className="text-xs font-black"
                    style={{ color: primary_color }}
                  >
                    +{" "}
                    {Number(addon.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected ? "" : "border-menu-border"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: primary_color,
                          borderColor: primary_color,
                        }
                      : {}
                  }
                >
                  {isSelected && (
                    <CheckCircleIcon
                      size={16}
                      weight="fill"
                      style={{ color: button_text_color || "#fff" }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Modal */}
        <div className="p-6 bg-menu-footer border-t border-menu-border/20">
          <button
            onClick={confirmAddToCart}
            className="w-full py-4 font-black rounded-2xl flex items-center justify-center gap-3"
            style={{
              backgroundColor: primary_color,
              color: button_text_color || "#fff",
            }}
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
