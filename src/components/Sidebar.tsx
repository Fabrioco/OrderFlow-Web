"use client";
import {
  Receipt,
  CookingPot,
  Gear,
  Question,
  SignOut,
  UserSwitchIcon,
  MoonIcon,
  SunIcon,
  BookOpenIcon,
  CashRegisterIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export function Sidebar({
  tenantName,
  tenantLogoUrl,
}: {
  tenantName: string;
  tenantLogoUrl: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<string | null>(null);

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
      icon: BookOpenIcon,
      label: "Histórico",
      path: `/${slug}/painel/historico`,
    },
    {
      icon: CashRegisterIcon,
      label: "Comanda",
      path: `/${slug}/painel/pdv`,
    },
    {
      icon: Gear,
      label: "Ajustes",
      path: `/${slug}/painel/configuracoes`,
    },
    ...(role === "admin"
      ? [
          {
            icon: UserSwitchIcon,
            label: "Admin",
            path: `/admin`,
          },
        ]
      : []),
  ];

  useEffect(() => {
    async function loadUserRole() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        if (error) throw error;
        setRole(data.role);
      } catch (err) {
        console.error("Erro ao buscar role:", err);
      }
    }
    loadUserRole();
  }, [supabase]);

  const mobileMenuItems = menuItems.filter((item) => item.path !== "/admin");


  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg+) ── */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-surface border-r border-border p-6 lg:flex z-40">
        <div className="mb-10 text-xl font-bold tracking-tighter text-accent flex flex-col">
          <span>The Order Flow</span>
          {/* <span className="text-sm">Flow</span> */}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {tenantLogoUrl ? (
            <img
              src={tenantLogoUrl}
              alt={tenantName}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {tenantName[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-gray-900">{tenantName}</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
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

        <div className="space-y-1 border-t border-border pt-6">
          {/* Toggle tema — desktop */}


          <Link
            href={`/${slug}/suporte`}
            className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text transition-colors group"
          >
            <Question size={18} className="group-hover:text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
              Suporte
            </span>
          </Link>


        </div>
      </aside>
      {/* ── MOBILE BOTTOM TAB BAR (sm/md) ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 lg:hidden z-[100] pb-safe">
        {mobileMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${isActive ? "bg-accent/10" : ""}`}
              >
                <item.icon size={24} weight={isActive ? "fill" : "duotone"} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>{" "}
    </>
  );
}
