import { CheckIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function PricingCard({
  title,
  price,
  features,
  buttonText,
  highlighted = false,
}: any) {
  const router = useRouter();
  return (
    <div
      className={`p-10 rounded-3xl border transition-all flex flex-col relative overflow-hidden ${
        highlighted
          ? "border-accent bg-accent/3 ring-1 ring-accent/50 shadow-[0_0_60px_rgba(139,92,246,0.1)]"
          : "border-border bg-surface"
      }`}
    >
      {highlighted && (
        <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-menu-text bg-accent px-2 py-1 rounded">
          Popular
        </span>
      )}
      <h4 className="text-xl font-bold mb-2 text-text-secondary">{title}</h4>
      <div className="flex items-baseline gap-1 mb-8">
        {price !== "Custom" && (
          <span className="text-text-secondary font-medium">R$</span>
        )}
        <span className="text-5xl font-bold tracking-tight text-text">
          {price}
        </span>
        {price !== "Custom" && (
          <span className="text-text-muted text-sm">/mês</span>
        )}
      </div>

      <ul className="space-y-4 mb-10 grow">
        {features.map((f: string) => (
          <li
            key={f}
            className="flex items-center gap-3 text-sm text-text-secondary"
          >
            <CheckIcon size={18} weight="bold" className="text-accent" /> {f}
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${
          highlighted
            ? "bg-linear-to-r from-[#C084FC] to-accent text-menu-text hover:brightness-110 shadow-lg shadow-accent/20"
            : "bg-surface-alt text-text hover:bg-border"
        }`}
        onClick={() => router.push("register")}
      >
        {buttonText}
      </button>
    </div>
  );
}
