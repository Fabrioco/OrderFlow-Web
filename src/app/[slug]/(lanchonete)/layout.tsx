"use client";
import { TrialBanner } from "@/components/[slug]/(lanchonete)/PlanGate";
import { Sidebar } from "@/components/Sidebar";
import { usePlan } from "@/hooks/usePlan";
import React from "react";

export default function LanchoneteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // ❗ precisa resolver a Promise
  const [slug, setSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const { trialDaysLeft, isTrialExpired, isBlocked } = usePlan(slug ?? "");

  if (!slug) return null;

  return (
    <>
      <Sidebar />

      <div className="fixed top-0 right-0 z-60">
        <TrialBanner
          trialDaysLeft={trialDaysLeft}
          isTrialExpired={isTrialExpired}
          isBlocked={isBlocked}
        />
      </div>

      <main className="pt-15 pb-24">{children}</main>
    </>
  );
}
