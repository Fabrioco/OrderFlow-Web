import React from "react";

export function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-[#0e0e0e] p-5 rounded-3xl border border-[#353534] flex gap-4 items-start">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-sm font-black text-white leading-tight">{value}</p>
        <p className="text-[11px] text-[#ccc3d8] mt-1 font-medium opacity-60">
          {sub}
        </p>
      </div>
    </div>
  );
}
