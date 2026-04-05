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
  { href: "/admin",          label: "Dashboard",        icon: ChartBarIcon },
  { href: "/admin/tenants",  label: "Tenants",          icon: BuildingStorefrontIcon },
  { href: "/admin/revenue",  label: "Revenue",          icon: CurrencyDollarIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#1C1B1B] flex flex-col py-8 px-4 z-50 border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C084FC] to-accent flex items-center justify-center shrink-0">
          <span className="text-[#25005A] font-black text-xs">OF</span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tighter text-white leading-none">
            OrderFlow
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mt-0.5">
            SuperAdmin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[#2A2A2A] text-white"
                  : "text-text-muted hover:text-white hover:bg-[#2A2A2A]/50"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${active ? "text-accent" : "text-text-muted"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      <div className="mt-auto space-y-3">
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
            System Status
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-medium text-white/80">
              All systems nominal
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
