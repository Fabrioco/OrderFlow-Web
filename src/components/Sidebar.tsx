"use client";
import {
  Receipt,
  CookingPot,
  Gear,
  ShieldCheck,
  Plus,
  Question,
  SignOut,
} from "@phosphor-icons/react";

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-surface border-r border-border p-6 lg:flex z-40">
      <div className="mb-10 text-xl font-bold tracking-tighter text-accent">
        OrderFlow
      </div>

      <nav className="flex-1 space-y-2">
        {[
          { icon: Receipt, label: "Pedidos", active: true },
          { icon: CookingPot, label: "Cardápio" },
          { icon: Gear, label: "Configurações" },
        ].map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
              item.active
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-text-secondary hover:bg-surface-alt hover:text-text"
            }`}
          >
            <item.icon size={20} weight={item.active ? "fill" : "regular"} />
            <span className="text-sm font-semibold">{item.label}</span>
          </a>
        ))}
      </nav>

      <button className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#C084FC] to-accent py-4 font-bold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
        <Plus size={20} weight="bold" />
        Novo Pedido
      </button>

      <div className="space-y-2 border-t border-border pt-6">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text transition-colors"
        >
          <Question size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Suporte
          </span>
        </a>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-danger transition-colors">
          <SignOut size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
