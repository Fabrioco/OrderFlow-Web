import React from "react";

export function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  sub: string | null;
}) {
  return (
    <div className="bg-menu-surface-deep p-5 rounded-3xl border border-menu-border flex gap-4 items-start">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-menu-accent uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-sm font-black text-menu-text leading-tight">{value}</p>
        <p className="text-[11px] text-menu-text-secondary mt-1 font-medium opacity-60">
          {sub}
        </p>
      </div>
    </div>
  );
}
