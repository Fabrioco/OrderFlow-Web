"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { ClockIcon, SpinnerIcon } from "@phosphor-icons/react";

export default function UpgradePendingPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

//   const status = params.get("status");
  const paymentId = params.get("payment_id");

  useEffect(() => {
    // opcional: redireciona depois de um tempo
    const t = setTimeout(() => {
      router.push(`/${slug}/dashboard`);
    }, 8000);

    return () => clearTimeout(t);
  }, [slug]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="text-center flex flex-col items-center gap-4 max-w-md">
        {/* Ícone */}
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ClockIcon size={28} className="text-amber-400" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold">Pagamento em análise</h1>

        {/* Descrição */}
        <p className="text-text-muted text-sm leading-relaxed">
          Seu pagamento foi recebido e está sendo processado. Isso pode levar
          alguns minutos dependendo do método escolhido.
        </p>

        {/* Info adicional */}
        <p className="text-xs text-text-muted">ID: {paymentId}</p>

        {/* Loader */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <SpinnerIcon className="animate-spin" size={14} />
          Aguardando confirmação...
        </div>

        {/* Ação manual */}
        <button
          onClick={() => router.push(`/${slug}/dashboard`)}
          className="mt-4 px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-surface"
        >
          Ir para o painel
        </button>
      </div>
    </main>
  );
}
