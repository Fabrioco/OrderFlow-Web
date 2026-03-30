"use client";
import { Sidebar } from "@/components/Sidebar";
import {
  Timer,
  FadersHorizontal,
  MagnifyingGlass,
  Check,
  Pizza,
  ArrowClockwise,
} from "@phosphor-icons/react";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative">
      <div className="bg-noise pointer-events-none" />
      {/* Glow de fundo igual da Landing */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-250 h-150 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <Sidebar />

      <section className="lg:ml-64 p-8 md:p-12 relative z-10">
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Painel de Controle
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">
              Gestão de Pedidos
            </h1>
          </div>

          <div className="flex gap-3">
            <div className="bg-surface border border-border px-4 py-2.5 rounded-xl flex items-center gap-3">
              <Timer size={20} weight="duotone" className="text-accent" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-muted uppercase leading-none mb-1">
                  Média de Preparo
                </span>
                <span className="text-sm font-bold text-text tracking-tight">
                  12 MINUTOS
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard label="Pendentes" value="08" />
          <StatCard label="Em Preparo" value="14" highlighted />
          <StatCard label="Em Rota" value="05" />
          <StatCard label="Faturamento" value="R$ 2.480" isCurrency />
        </div>

        {/* Live Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Cozinha</h2>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-alt border border-border rounded text-[10px] font-black text-accent uppercase tracking-tighter">
              <ArrowClockwise className="animate-spin" /> Live
            </span>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text transition-all">
              <MagnifyingGlass size={20} />
            </button>
            <button className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text transition-all">
              <FadersHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Order Card: Seguindo estilo do PricingCard da Landing */}
          <div className="p-8 rounded-3xl border border-accent/20 bg-surface shadow-2xl shadow-accent/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/40 to-transparent" />

            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                  Pedido #8941
                </span>
                <h3 className="text-xl font-bold text-text mt-1">
                  Mariana Souza
                </h3>
              </div>
              <div className="bg-accent/10 text-accent px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-accent/20">
                Preparando
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">
                  1x Pizza Margherita G
                </span>
                <span className="font-bold text-text">R$ 62,00</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-[10px] font-black text-text-muted uppercase mb-2">
                  <span>Progresso</span>
                  <span className="text-accent">8 min restantes</span>
                </div>
                <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-accent w-2/3 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                </div>
              </div>
            </div>

            <button className="w-full py-4 rounded-xl font-bold bg-text text-bg hover:opacity-90 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.01]">
              <Check size={20} weight="bold" /> Finalizar Pedido
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
  isCurrency = false,
}: any) {
  return (
    <div
      className={`p-8 rounded-2xl border border-border bg-surface hover:bg-surface-alt transition-all group ${highlighted ? "border-accent/30 ring-1 ring-accent/10" : ""}`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${highlighted ? "text-accent" : "text-text-muted"}`}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        {isCurrency && (
          <span className="text-lg font-bold text-text-secondary">R$</span>
        )}
        <span
          className={`text-5xl font-bold tracking-tight ${highlighted ? "text-accent" : "text-text"}`}
        >
          {value.replace("R$ ", "")}
        </span>
      </div>
    </div>
  );
}
