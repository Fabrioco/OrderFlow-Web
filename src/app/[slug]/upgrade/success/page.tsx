"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { CheckIcon, SpinnerIcon } from "@phosphor-icons/react";

export default function UpgradeSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

//   const status = params.get("status");
  const paymentId = params.get("payment_id");

  useEffect(() => {
    // redireciona depois de alguns segundos
    const t = setTimeout(() => {
      router.push(`/${slug}/dashboard`);
    }, 4000);

    return () => clearTimeout(t);
  }, [slug]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckIcon size={28} className="text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold">Pagamento aprovado</h1>

        <p className="text-text-muted text-sm">
          Seu plano está sendo ativado...
        </p>

        <p className="text-xs text-text-muted">ID: {paymentId}</p>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <SpinnerIcon className="animate-spin" size={14} />
          Redirecionando...
        </div>
      </div>
    </main>
  );
}
