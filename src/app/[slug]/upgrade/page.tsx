"use client";

import { useEffect, useState } from "react";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { useParams, useRouter } from "next/navigation";
import {
  Lightning,
  Sparkle,
  Buildings,
  ArrowLeftIcon,
  CheckIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useTenant } from "@/hooks/useTenant";
import { createClient } from "@/utils/supabase/client";

type PlanType = "essencial" | "basico" | "pro";

const PLANS: {
  id: PlanType;
  label: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlight?: boolean;
  accentClass: string;
  badgeBg: string;
  ringClass: string;
  borderActive: string;
}[] = [
  {
    id: "essencial",
    label: "Essencial",
    price: 19.9,
    description: "Pra quem tá começando",
    icon: <Lightning size={18} weight="duotone" />,
    accentClass: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    ringClass: "ring-emerald-500/20",
    borderActive: "border-emerald-500/40",
    features: [
      "Cardápio digital",
      "Painel de pedidos",
      "Delivery pelo app",
      "Modo PDV / garçom",
    ],
  },
  {
    id: "basico",
    label: "Básico",
    price: 39.9,
    description: "O mais popular",
    icon: <Sparkle size={18} weight="duotone" />,
    highlight: true,
    accentClass: "text-accent",
    badgeBg: "bg-accent/10",
    ringClass: "ring-accent/20",
    borderActive: "border-accent/50",
    features: [
      "Tudo do Essencial",
      "IA para insights",
      "Relatórios profissionais",
      "Suporte prioritário",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    price: 79.9,
    description: "Para redes e franquias",
    icon: <Buildings size={18} weight="duotone" />,
    accentClass: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    ringClass: "ring-amber-500/20",
    borderActive: "border-amber-500/40",
    features: [
      "Tudo do Básico",
      "Múltiplas unidades",
      "Gestão de funcionários",
      "Relatórios consolidados",
    ],
  },
];

export default function UpgradePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { tenant } = useTenant(slug);
  const supabase = createClient();

  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [mpReady, setMpReady] = useState(false);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, {
      locale: "pt-BR",
    });
    setMpReady(true);
  }, []);

  // Substitua a sua handlePayment antiga por esta:
  async function startCheckout() {
    if (!selectedPlan || !tenant) return;
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/plans/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          plan: selectedPlan,
          slug: slug, // para as back_urls
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Aqui acontece o redirecionamento
      } else {
        throw new Error(data.error || "Erro ao redirecionar");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }
  const current = PLANS.find((p) => p.id === selectedPlan);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !tenant) {
        setIsAllowed(false);
        return;
      }

      const { data } = await supabase
        .from("tenant_users")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsAllowed(!!data);
    }

    checkAccess();
  }, [tenant]);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    );
  }

  if (isAllowed === null) {
    return <div>Carregando...</div>;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Acesso negado</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg text-text font-sans relative selection:bg-accent/30">
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-250 h-150 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <section className="max-w-5xl mx-auto px-6 py-10 pb-32 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-text-muted hover:text-text text-xs font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <ArrowLeftIcon size={14} /> Voltar
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-alt text-[10px] uppercase tracking-[0.2em] font-bold text-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Upgrade de Plano
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-2">
          Escolha seu plano
        </h1>
        <p className="text-text-muted text-base mb-12">
          Upgrade para{" "}
          <span className="text-text font-semibold">{tenant.name}</span>
        </p>

        {/* Cards de plano */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative group text-left p-6 rounded-[28px] border transition-all duration-300 active:scale-[0.98]
                  ${
                    isSelected
                      ? `${plan.borderActive} bg-surface ring-1 ${plan.ringClass} -translate-y-1 shadow-2xl shadow-accent/5`
                      : "border-border bg-surface/50 hover:border-white/20 hover:bg-surface"
                  }`}
              >
                {/* Glow interno */}
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    Mais popular
                  </div>
                )}

                {/* Ícone */}
                <div
                  className={`w-9 h-9 rounded-xl ${plan.badgeBg} ${plan.accentClass} flex items-center justify-center mb-4 border border-white/5`}
                >
                  {plan.icon}
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">
                  {plan.description}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-text mb-3">
                  {plan.label}
                </h2>

                <div className="mb-5">
                  <span className="text-text-muted text-sm">R$ </span>
                  <span
                    className={`text-3xl font-black tracking-tight ${isSelected ? plan.accentClass : "text-text"}`}
                  >
                    {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-text-muted text-xs">/mês</span>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  {plan.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-xs text-text-secondary"
                    >
                      <CheckIcon
                        size={12}
                        className={plan.accentClass}
                        strokeWidth={3}
                      />
                      {f}
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div
                    className={`absolute bottom-4 right-4 w-5 h-5 rounded-full ${plan.badgeBg} ${plan.accentClass} border ${plan.borderActive} flex items-center justify-center`}
                  >
                    <CheckIcon size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Área de checkout */}
        {selectedPlan && mpReady && (
          <div className="border border-border bg-surface rounded-[28px] p-8 max-w-2xl">
            {/* Resumo */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">
                  Você está assinando
                </p>
                <p className="text-lg font-bold text-text">
                  Plano {current?.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">
                  Total mensal
                </p>
                <p
                  className={`text-2xl font-black tracking-tighter ${current?.accentClass}`}
                >
                  R$ {current?.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            {/* Estado: sucesso */}
            {status === "success" && (
              <div className="py-10 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckIcon
                    size={24}
                    className="text-emerald-400"
                    strokeWidth={3}
                  />
                </div>
                <p className="text-lg font-bold text-text">Plano ativado!</p>
                <p className="text-text-muted text-sm">
                  Redirecionando para o painel...
                </p>
              </div>
            )}
            {/* Estado: loading */}
            {status === "loading" && (
              <div className="py-10 flex flex-col items-center justify-center gap-3">
                <SpinnerIcon size={24} className="animate-spin text-accent" />
                <p className="text-sm text-text-muted">
                  Processando pagamento...
                </p>
              </div>
            )}
            {/* Estado: formulário */}
            {(status === "idle" || status === "error") && (
              <div className="flex flex-col gap-6">
                {errorMsg && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                <div className="bg-surface-alt/50 border border-border p-6 rounded-2xl">
                  <h4 className="text-sm font-bold text-text mb-2">
                    Método de Pagamento
                  </h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Você será redirecionado para o ambiente seguro do{" "}
                    <strong>Mercado Pago</strong> para concluir o pagamento via
                    Pix, Cartão ou Boleto.
                  </p>
                </div>

                <button
                  onClick={startCheckout}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 
                ${current?.accentClass.replace("text", "bg")} text-[#25005A] hover:opacity-90 shadow-lg`}
                >
                  Ir para Pagamento
                </button>
              </div>
            )}{" "}
          </div>
        )}

        {!selectedPlan && (
          <p className="text-center text-text-muted text-sm mt-2">
            Selecione um plano acima para continuar
          </p>
        )}
      </section>
    </main>
  );
}
