"use client";

import { useParams, useRouter } from "next/navigation";
import { LockSimple, ArrowRight, Warning } from "@phosphor-icons/react";
import { type Feature, type PlanType } from "@/hooks/usePlan";

/* ── PlanGate ───────────────────────────────────────────────
   Envolve qualquer feature restrita por plano.
   Se o plano não tem acesso, mostra o card de upgrade no lugar.
─────────────────────────────────────────────────────────── */

const FEATURE_LABEL: Record<Feature, string> = {
  cardapio: "Cardápio Digital",
  painel: "Painel de Pedidos",
  relatorios: "Relatórios Profissionais",
  ia: "IA Integrada",
  suporte: "Suporte Prioritário",
  multi_unidade: "Múltiplas Unidades",
  funcionarios: "Gestão de Funcionários",
};

const FEATURE_PLAN: Record<Feature, PlanType> = {
  cardapio: "essencial",
  painel: "essencial",
  relatorios: "pro",
  ia: "pro",
  suporte: "pro",
  multi_unidade: "premium",
  funcionarios: "premium",
};

const PLAN_PRICE: Record<PlanType, string> = {
  free: "Gratuito",
  essencial: "R$29,90/mês",
  pro: "R$39,90/mês",
  premium: "R$69,90/mês",
};

interface PlanGateProps {
  feature: Feature;
  can: boolean;
  children: React.ReactNode;
  // Se true, renderiza invisível ao invés de mostrar o card de upgrade
  silent?: boolean;
}

export function PlanGate({
  feature,
  can,
  children,
  silent = false,
}: PlanGateProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  if (can) return <>{children}</>;
  if (silent) return null;

  const requiredPlan = FEATURE_PLAN[feature];

  return (
    <div className="w-full rounded-3xl border border-dashed border-border bg-surface-alt/30 p-10 flex flex-col items-center justify-center text-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <LockSimple size={28} weight="duotone" className="text-accent" />
      </div>
      <div>
        <p className="text-sm font-black text-text uppercase tracking-tight">
          {FEATURE_LABEL[feature]}
        </p>
        <p className="text-text-muted text-xs mt-1.5 max-w-xs">
          Esta funcionalidade está disponível a partir do plano{" "}
          <span className="text-accent font-bold capitalize">
            {requiredPlan}
          </span>{" "}
          ({PLAN_PRICE[requiredPlan]}).
        </p>
      </div>
      <button
        onClick={() => router.push(`/${slug}/upgrade`)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C084FC] to-accent text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
      >
        Ver planos <ArrowRight size={14} weight="bold" />
      </button>
    </div>
  );
}

/* ── TrialBanner ────────────────────────────────────────────
   Banner de aviso mostrado no topo do painel.
   Aparece quando o tenant está no trial ou o plano expirou.
─────────────────────────────────────────────────────────── */

interface TrialBannerProps {
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
  isBlocked: boolean;
}

export function TrialBanner({
  trialDaysLeft,
  isTrialExpired,
  isBlocked,
}: TrialBannerProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Nada para mostrar
  if (!isBlocked && !isTrialExpired && trialDaysLeft === null) return null;

  // Tenant bloqueado pelo admin
  if (isBlocked) {
    return (
      <div className="w-full px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-red-400">
          <Warning size={18} weight="duotone" />
          <p className="text-xs font-bold">
            Sua conta foi suspensa. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Trial expirado
  if (isTrialExpired) {
    return (
      <div className="w-full px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-red-400">
          <Warning size={18} weight="duotone" />
          <p className="text-xs font-bold">
            Seu período de teste encerrou. Assine um plano para continuar usando
            o OrderFlow.
          </p>
        </div>
        <button
          onClick={() => router.push(`/${slug}/upgrade`)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
        >
          Assinar agora <ArrowRight size={12} weight="bold" />
        </button>
      </div>
    );
  }

  // Trial ativo — aviso de dias restantes
  if (trialDaysLeft !== null) {
    const isUrgent = trialDaysLeft <= 3;
    return (
      <div
        className={`w-full px-6 py-3 border-b flex items-center justify-between gap-4 ${isUrgent ? "bg-amber-500/10 border-amber-500/20" : "bg-accent/5 border-accent/10"}`}
      >
        <div
          className={`flex items-center gap-2.5 ${isUrgent ? "text-amber-400" : "text-accent"}`}
        >
          <Warning size={18} weight="duotone" />
          <p className="text-xs font-bold">
            {trialDaysLeft === 0
              ? "Último dia do seu teste gratuito."
              : `Seu teste gratuito termina em ${trialDaysLeft} ${trialDaysLeft === 1 ? "dia" : "dias"}.`}
          </p>
        </div>
        <button
          onClick={() => router.push(`/${slug}/upgrade`)}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all ${isUrgent ? "bg-amber-500 text-black" : "bg-accent text-white shadow-lg shadow-accent/20"}`}
        >
          Ver planos <ArrowRight size={12} weight="bold" />
        </button>
      </div>
    );
  }

  return null;
}
