export function CategoryNav({
  categories,
  activeCategory,
  setActiveCategory,
}: {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}) {
  return (
    <nav className="px-6 md:px-16 mt-6 sticky top-0 z-40 bg-menu-bg/90 backdrop-blur-xl py-4 border-b border-menu-border/20">
      <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === cat
                ? "bg-menu-accent text-menu-accent-on border-[#D2BBFF] shadow-[0_0_20px_rgba(210,187,255,0.25)]"
                : "bg-menu-surface border-menu-border/40 text-menu-text-secondary hover:border-[#D2BBFF]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
