export function CategoryNav({
  categories,
  activeCategory,
  setActiveCategory,
  button_text_color,
  primary_color,
}: {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  button_text_color?: string;
  primary_color?: string;
}) {
  return (
    <nav className="px-6 md:px-16 mt-6 sticky top-0 z-40 bg-menu-bg/90 backdrop-blur-xl py-4 border-b border-menu-border/20">
      <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              color: `${button_text_color}`,
              backgroundColor: `${primary_color}`,
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === cat
                ? "border-[#D2BBFF] shadow-[0_0_20px_rgba(210,187,255,0.25)]"
                : "hover:border-[#D2BBFF]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
