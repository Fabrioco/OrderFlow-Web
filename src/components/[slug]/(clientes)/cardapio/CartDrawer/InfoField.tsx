import React from "react";

export function InfoField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black text-menu-text-secondary uppercase tracking-widest">
        {icon && <span className="text-menu-accent/60">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
