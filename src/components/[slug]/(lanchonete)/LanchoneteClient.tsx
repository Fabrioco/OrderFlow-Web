"use client";

import { TrialBanner } from "@/components/[slug]/(lanchonete)/PlanGate";
import { Sidebar } from "@/components/Sidebar";
import { usePlan } from "@/hooks/usePlan";

export function LanchoneteClient({
  children,
  slug,
  primaryColor,
  tenantName,
  tenantLogoUrl,
}: {
  children: React.ReactNode;
  slug: string;
  primaryColor: string;
  tenantName: string;
  tenantLogoUrl: string | null;
}) {
  const { trialDaysLeft, isTrialExpired, isBlocked } = usePlan(slug);

  return (
    <div style={{ "--color-primary": primaryColor } as React.CSSProperties}>
      <Sidebar tenantName={tenantName} tenantLogoUrl={tenantLogoUrl} />
      <div className="fixed top-0 right-0 z-60">
        <TrialBanner
          trialDaysLeft={trialDaysLeft}
          isTrialExpired={isTrialExpired}
          isBlocked={isBlocked}
        />
      </div>
      <main className="pt-15 pb-24">{children}</main>
    </div>
  );
}
