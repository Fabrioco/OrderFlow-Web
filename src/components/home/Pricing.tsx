import { PricingCard } from "./PricingCard";

export function PricingGrid() {
  return (
    <section id="prices" className="py-32 px-6 relative">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-accent">
          Planos
        </span>
        <h2 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight text-text">
          Planos que escalam com você.
        </h2>
      </div>

      <div className="flex gap-8 max-w-6xl mx-auto items-center justify-center">
        <PricingCard
          title="Essencial"
          price="29,90"
          features={[
            "Pedidos Ilimitados",
            "Cardápio Digital",
            "Impressão de etiquetas",
            "Teste 100% gratuito (14 dias)",
          ]}
          buttonText="Começar grátis"
        />
      </div>
    </section>
  );
}
