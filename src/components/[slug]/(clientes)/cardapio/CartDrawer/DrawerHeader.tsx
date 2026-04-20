import { Step } from "@/types/supabase";
import { CaretLeftIcon, XIcon } from "@phosphor-icons/react";

export default function DrawerHeader({
  setIsCartOpen,
  step,
  setStep,
}: {
  setIsCartOpen: (open: boolean) => void;
  step: Step;
  setStep: (step: Step) => void;
}) {
  return (
    <div className="p-6 border-b border-menu-border/20 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {step !== "cart" && (
          <button
            onClick={() => setStep("cart")}
            className="p-1.5 hover:bg-[#2A2A2A] rounded-full transition-colors text-menu-text-secondary"
          >
            <CaretLeftIcon size={18} weight="bold" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-menu-text">
            {step === "cart" ? "Sua Sacola" : "Seus Dados"}
          </h2>
          <div className="flex gap-1 mt-1">
            {(["cart", "info"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-6 bg-menu-accent"
                    : i < (["cart", "info"] as Step[]).indexOf(step)
                      ? "w-3 bg-menu-accent/60"
                      : "w-3 bg-[#4A4455]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsCartOpen(false)}
        className="p-2 hover:bg-[#2A2A2A] rounded-full transition-colors"
      >
        <XIcon size={20} />
      </button>
    </div>
  );
}
