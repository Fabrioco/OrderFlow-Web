"use client";

import { useRouter, useParams } from "next/navigation";

export default function UpgradeFailurePage() {
  //   const params = useSearchParams();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  //   const status = params.get("status");

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="text-center flex flex-col items-center gap-4 max-w-sm">
        <h1 className="text-2xl font-bold text-red-400">
          Pagamento não aprovado
        </h1>

        <p className="text-text-muted text-sm">
          Houve um problema ao processar seu pagamento.
        </p>

        <button
          onClick={() => router.push(`/${slug}/upgrade`)}
          className="mt-4 px-4 py-2 rounded-xl bg-red-500 text-menu-text text-sm font-bold"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
