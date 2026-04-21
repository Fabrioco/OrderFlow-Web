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
  BookOpenIcon
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeProvider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

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

  async function handleLogout() {
    toast.promise(
      async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.replace("/login");
        router.refresh();
      },
      {
        loading: "Saindo...",
        success: "Até logo!",
        error: "Erro ao sair.",
      },
    );
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg+) ── */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-surface border-r border-border p-6 lg:flex z-40">
        <div className="mb-10 text-xl font-bold tracking-tighter text-accent uppercase">
          OrderFlow
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
          <button
            onClick={toggle}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text transition-colors group"
          >
            {isDark ? (
              <SunIcon size={18} className="text-amber-400" />
            ) : (
              <MoonIcon size={18} className="group-hover:text-accent" />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
              {isDark ? "Tema Claro" : "Tema Escuro"}
            </span>
          </button>

          <Link
            href={`/${slug}/suporte`}
            className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-text transition-colors group"
          >
            <Question size={18} className="group-hover:text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
              Suporte
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-red-400 transition-colors group"
          >
            <SignOut size={18} className="group-hover:text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM TAB BAR (sm/md) ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 lg:hidden z-[100] pb-safe">
        {menuItems.map((item) => {
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

        {/* Toggle tema — mobile */}
        <button
          onClick={toggle}
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          className="flex flex-col items-center gap-1 px-3 py-2 text-text-muted hover:text-text transition-colors"
        >
          <div className="p-2">
            {isDark ? (
              <SunIcon size={24} weight="duotone" className="text-amber-400" />
            ) : (
              <MoonIcon size={24} weight="duotone" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {isDark ? "Claro" : "Escuro"}
          </span>
        </button>

        {/* Botão de Sair no Mobile */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-2 text-text-muted hover:text-red-400 transition-colors"
        >
          <div className="p-2">
            <SignOut size={24} weight="duotone" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Sair
          </span>
        </button>
      </nav>
    </>
  );
}
