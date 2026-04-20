import Link from "next/link";

export function Hero() {
  return (
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
        A infraestrutura definitiva para lanchonetes modernas. Gerencie pedidos,
        cardápios e métricas com a precisão de um arquiteto.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/register"
          prefetch
          className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-linear-to-br from-[#C084FC] to-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 text-menu-text"
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
  );
}
