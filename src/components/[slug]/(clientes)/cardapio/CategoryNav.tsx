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
    <nav className="px-6 md:px-16 mt-6 sticky top-0 z-40 bg-[#131313]/90 backdrop-blur-xl py-4 border-b border-[#4A4455]/20">
      <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === cat
                ? "bg-[#D2BBFF] text-[#25005A] border-[#D2BBFF] shadow-[0_0_20px_rgba(210,187,255,0.25)]"
                : "bg-[#1C1B1B] border-[#4A4455]/40 text-[#CCC3D8] hover:border-[#D2BBFF]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
