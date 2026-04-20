"use client";
import { House, Receipt, ClockClockwise } from "@phosphor-icons/react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeProvider";

export function BottomNav({
  slug,
  hasActiveOrder,
}: {
  slug: string;
  hasActiveOrder: boolean;
}) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const tabs = [
    {
      label: "Cardápio",
      icon: (
        <House
          size={24}
          weight={pathname === `/${slug}/cardapio` ? "fill" : "regular"}
        />
      ),
      href: `/${slug}/cardapio`,
      active: pathname === `/${slug}/cardapio`,
    },
    {
      label: "Meus Pedidos",
      icon: (
        <Receipt
          size={24}
          weight={
            pathname.includes("/meus-pedidos") && !pathname.includes("/status")
              ? "fill"
              : "regular"
          }
        />
      ),
      href: `/${slug}/meus-pedidos`,
      active:
        pathname.includes("/meus-pedidos") && !pathname.includes("/status"),
    },
  ];

  if (hasActiveOrder) {
    tabs.push({
      label: "Pedido Atual",
      icon: (
        <ClockClockwise
          size={24}
          weight="fill"
          className="animate-pulse text-menu-accent"
        />
      ),
      href: `/${slug}/meus-pedidos/atual`,
      active: pathname.includes("/status"),
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-100 bg-menu-surface/80 backdrop-blur-2xl border-t border-menu-border/30 px-6 pb-6 pt-3 flex justify-around items-center">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`flex flex-col items-center gap-1 transition-all ${
            tab.active
              ? "text-menu-accent"
              : "text-menu-text-secondary/60 hover:text-menu-text-secondary"
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${tab.active ? "bg-menu-accent/10" : ""}`}
          >
            {tab.icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {tab.label}
          </span>
        </Link>
      ))}

      {/* Toggle de tema */}
      <button
        onClick={toggle}
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        className="flex flex-col items-center gap-1 transition-all text-menu-text-secondary/60 hover:text-menu-text-secondary"
      >
        <div className="p-1 rounded-xl transition-all">
          {isDark ? (
            <SunIcon size={24} weight="regular" className="text-amber-400" />
          ) : (
            <MoonIcon size={24} weight="regular" className="text-menu-accent" />
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isDark ? "Claro" : "Escuro"}
        </span>
      </button>
    </nav>
  );
}
