import Link from "next/link";

export function Header() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
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
  );
}
