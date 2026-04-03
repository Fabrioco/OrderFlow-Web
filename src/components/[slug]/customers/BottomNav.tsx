"use client"

import { House, Receipt, ClockClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({
  slug,
  hasActiveOrder,
}: {
  slug: string;
  hasActiveOrder: boolean;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Cardápio",
      icon: (
        <House
          size={24}
          weight={pathname === `/${slug}` ? "fill" : "regular"}
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

  // Se houver um pedido ativo, adicionamos a aba de "Acompanhar"
  if (hasActiveOrder) {
    tabs.push({
      label: "Pedido Atual",
      icon: (
        <ClockClockwise
          size={24}
          weight="fill"
          className="animate-pulse text-[#D2BBFF]"
        />
      ),
      href: `/${slug}/meus-pedidos/atual`, // Ajuste para sua rota de status real
      active: pathname.includes("/status"),
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-100 bg-[#1C1B1B]/80 backdrop-blur-2xl border-t border-[#4A4455]/30 px-6 pb-6 pt-3 flex justify-around items-center">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`flex flex-col items-center gap-1 transition-all ${
            tab.active
              ? "text-[#D2BBFF]"
              : "text-[#CCC3D8]/60 hover:text-[#CCC3D8]"
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${tab.active ? "bg-[#D2BBFF]/10" : ""}`}
          >
            {tab.icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {tab.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
