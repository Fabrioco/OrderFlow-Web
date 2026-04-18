import React from "react";

export function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 rounded-2xl border border-border bg-surface hover:bg-surface-alt transition-all group cursor-default">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all text-accent">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-text">{title}</h3>
      <p className="text-text-secondary leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
