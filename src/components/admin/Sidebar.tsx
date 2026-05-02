"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBarIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: ChartBarIcon,
    shortLabel: "Dash",
  },
  {
    href: "/admin/tenants",
    label: "Tenants",
    icon: BuildingStorefrontIcon,
    shortLabel: "Tenants",
  },
  {
    href: "/admin/revenue",
    label: "Revenue",
    icon: CurrencyDollarIcon,
    shortLabel: "Revenue",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const confirm = window.confirm("Deseja realmente sair?");
    if (confirm) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  }

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Lateral) --- */}
      <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 bg-menu-surface flex-col py-8 px-4 z-50 border-r border-border">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#C084FC] to-accent flex items-center justify-center shrink-0">
            <span className="text-menu-accent-on font-black text-xs">OF</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tighter text-menu-text leading-none">
              The Order Flow
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-0.5">
              SuperAdmin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#2A2A2A] text-menu-text"
                    : "text-text-muted hover:text-menu-text hover:bg-[#2A2A2A]/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? "text-accent" : "text-text-muted"}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Sair
        </button>
      </aside>

      {/* --- MOBILE NAV (Bottom Bar) --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-menu-surface/80 backdrop-blur-lg border-t border-white/5 px-4 pb-6 pt-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map(({ href, shortLabel, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 relative py-1"
              >
                {active && (
                  <div className="absolute -top-3 w-8 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                )}
                <Icon
                  className={`w-6 h-6 ${active ? "text-accent scale-110" : "text-text-muted"}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase ${active ? "text-menu-text" : "text-text-muted"}`}
                >
                  {shortLabel}
                </span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 py-1 text-text-muted"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
}
