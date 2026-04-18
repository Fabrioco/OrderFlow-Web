"use client";
import React from "react";
import {
  TimerIcon,
  SquaresFourIcon,
  ChartBarIcon,
  CheckIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";

export default function Home() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      {/* BACKGROUND DECORATION */}
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-250 h-150 bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER */}
      <header className="fixed top-0 w-full h-20 flex items-center justify-between px-6 md:px-12 backdrop-blur-md z-50 border-b border-border bg-bg/20">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-accent">
            OrderFlow
          </span>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-text-secondary">
            <button
              onClick={() => scrollTo("hero")}
              className="hover:text-text transition-colors"
            >
              Plataforma
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="hover:text-text transition-colors"
            >
              Soluções
            </button>
            <button
              onClick={() => scrollTo("prices")}
              className="hover:text-text transition-colors"
            >
              Preços
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-lg font-bold text-sm bg-accent text-white hover:bg-accent-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            Começar agora
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-44 pb-20 px-6 text-center max-w-5xl mx-auto relative">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted mb-8"
          id="hero"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Acesso Antecipado
        </div>

        <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
          Seu negócio em <br />
          <span className="text-gradient">tempo real</span>, sem fricção.
        </h1>

        <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          A infraestrutura definitiva para lanchonetes modernas. Gerencie
          pedidos, cardápios e métricas com a precisão de um arquiteto.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            prefetch
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-linear-to-br from-[#C084FC] to-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 text-white"
          >
            Criar minha lanchonete
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg border border-border bg-surface hover:bg-surface-alt transition-all text-text">
            Agendar demonstração
          </button>
        </div>

        {/* MOCKUP DASHBOARD VISUAL */}
        <div className="mt-24 relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-accent/20 to-blue-500/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
          <div className="relative rounded-2xl border border-border bg-surface overflow-hidden aspect-video shadow-2xl">
            <div className="w-full h-full bg-linear-to-b from-accent/10 to-transparent p-8">
              <div className="w-full h-full flex items-end gap-2">
                {[40, 70, 45, 90, 65, 80, 50, 85, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 bg-linear-to-t from-accent/40 to-accent/5 rounded-t-md border-t border-accent/30"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-6 max-w-6xl mx-auto" id="features">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<TimerIcon size={24} weight="duotone" />}
            title="Real-time tracking"
            desc="Acompanhe cada etapa da produção instantaneamente. Do pedido à entrega final, sem delays."
          />
          <FeatureCard
            icon={<SquaresFourIcon size={24} weight="duotone" />}
            title="Menu management"
            desc="Edite preços, fotos e disponibilidade em segundos. Sincronização imediata em todos os canais."
          />
          <FeatureCard
            icon={<ChartBarIcon size={24} weight="duotone" />}
            title="Basic metrics"
            desc="Visualize faturamento, pratos mais vendidos e ticket médio através de relatórios editoriais impecáveis."
          />
        </div>
      </section>

      {/* PRICING SECTION */}
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

      {/* CTA FINAL */}
      <section className="py-40 px-6 text-center relative">
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-10 tracking-tight text-text">
            Pronto para transformar <br /> sua operação?
          </h2>
          <Link
            href="/register"
            className="group px-12 py-5 w-fit rounded-2xl text-xl font-bold bg-linear-to-r from-[#C084FC] to-accent hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all flex items-center gap-3 mx-auto text-white"
          >
            Criar minha lanchonete agora
            <CaretRightIcon
              size={24}
              weight="bold"
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <p className="mt-6 text-text-muted text-sm font-medium">
            Teste grátis por 14 dias. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-text-muted text-[10px] tracking-widest font-bold uppercase">
        <div className="text-center md:text-left">
          <p className="text-text-secondary mb-1">OrderFlow Solutions</p>
          <p>© 2026 ORDERFLOW. Todos os direitos reservados.</p>
        </div>
        <div className="flex gap-8">
          <Link href="#" className="hover:text-text transition-colors">
            Termos
          </Link>
          <Link href="#" className="hover:text-text transition-colors">
            Privacidade
          </Link>
          <Link href="#" className="hover:text-text transition-colors">
            Status
          </Link>
          <Link href="#" className="hover:text-text transition-colors">
            Contatos
          </Link>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 rounded-2xl border border-border bg-surface hover:bg-surface-alt transition-all group cursor-default">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all text-accent">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-text">{title}</h3>
      <p className="text-text-secondary leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  features,
  buttonText,
  highlighted = false,
}: any) {
  return (
    <div
      className={`p-10 rounded-3xl border transition-all flex flex-col relative overflow-hidden ${
        highlighted
          ? "border-accent bg-accent/3 ring-1 ring-accent/50 shadow-[0_0_60px_rgba(139,92,246,0.1)]"
          : "border-border bg-surface"
      }`}
    >
      {highlighted && (
        <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-white bg-accent px-2 py-1 rounded">
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
            ? "bg-linear-to-r from-[#C084FC] to-accent text-white hover:brightness-110 shadow-lg shadow-accent/20"
            : "bg-surface-alt text-text hover:bg-border"
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}
