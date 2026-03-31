"use client";
import {
  Receipt,
  CookingPot,
  Gear,
  Plus,
  Question,
  SignOut,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  // Extrai o slug da URL (ex: /nome-da-loja/painel/pedidos -> nome-da-loja)
  const segments = pathname.split("/");
  const slug = segments[1];

  const menuItems = [
    {
      icon: Receipt,
      label: "Pedidos",
      path: `/${slug}/painel/pedidos`,
    },
    {
      icon: CookingPot,
      label: "Cardápio",
      path: `/${slug}/painel/cardapio`,
    },
    {
      icon: Gear,
      label: "Configurações",
      path: `/${slug}/painel/configuracoes`,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-surface border-r border-border p-6 lg:flex z-40">
      <div className="mb-10 text-xl font-bold tracking-tighter text-accent uppercase">
        OrderFlow
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          // Verifica se a rota atual começa com o path do item
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 border ${
                isActive
                  ? "bg-accent/10 text-accent border-accent/20 shadow-[0_0_20px_rgba(124,58,237,0.05)]"
                  : "text-text-secondary border-transparent hover:bg-surface-alt hover:text-text"
              }`}
            >
              <item.icon
                size={22}
                weight={isActive ? "fill" : "duotone"}
                className={isActive ? "text-accent" : "text-text-muted"}
              />
              <span className="text-sm font-bold tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Botão de Ação Rápida */}
      <button className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-white shadow-lg shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]">
        <Plus size={20} weight="bold" />
        <span className="text-xs uppercase tracking-widest font-black">
          Novo Pedido
        </span>
      </button>

      {/* Footer da Sidebar */}
      <div className="space-y-1 border-t border-border pt-6">
        <Link
          href={`/${slug}/suporte`}
          className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text transition-colors group"
        >
          <Question
            size={18}
            className="group-hover:text-accent transition-colors"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            Suporte
          </span>
        </Link>

        <button
          onClick={() => {
            /* Lógica de Logout */
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-danger transition-colors group"
        >
          <SignOut
            size={18}
            className="group-hover:text-danger transition-colors"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
