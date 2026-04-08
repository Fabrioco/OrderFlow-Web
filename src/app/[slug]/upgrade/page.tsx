"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useParams } from "next/navigation";

type PlanType = "essencial" | "basico" | "pro";

const PLAN_PRICES = {
  essencial: 19.9,
  basico: 39.9,
  pro: 79.9,
};

export default function UpgradePage() {
  const { slug } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  // Init MP
  useEffect(() => {
    initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, {
      locale: "pt-BR",
    });
  }, []);

  // Busca tenant pelo slug
  useEffect(() => {
    async function fetchTenant() {
      const res = await fetch(`/api/public/tenant/${slug}`);
      const data = await res.json();
      setTenant(data);
    }

    if (slug) fetchTenant();
  }, [slug]);

  async function handlePayment(mpData: any) {
    if (!selectedPlan) return;

    const res = await fetch("/api/plans/checkout", {
      method: "POST",
      body: JSON.stringify({
        tenantId: tenant.id,
        plan: selectedPlan,
        mp_form_data: mpData,
      }),
    });

    const data = await res.json();

    if (data.status === "approved") {
      alert("Plano ativado!");
      window.location.href = `/${slug}`;
    } else {
      alert("Pagamento em processamento...");
    }
  }

  if (!tenant) return <div>Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upgrade de Plano</h1>

      {/* PLANOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(PLAN_PRICES).map(([plan, price]) => (
          <button
            key={plan}
            onClick={() => setSelectedPlan(plan as PlanType)}
            className={`p-4 border rounded-xl ${
              selectedPlan === plan ? "border-blue-500" : "border-gray-300"
            }`}
          >
            <h2 className="text-lg font-semibold capitalize">{plan}</h2>
            <p>R$ {price.toFixed(2)}</p>
          </button>
        ))}
      </div>

      {/* CHECKOUT */}
      {selectedPlan && (
        <div className="mt-6">
          <h2 className="mb-4 font-semibold">Pagando plano: {selectedPlan}</h2>

          <Payment
            initialization={{
              amount: PLAN_PRICES[selectedPlan],
            }}
            onSubmit={async (formData) => {
              console.log("FORM DATA FRONT:", formData); // 👈 debug
              await handlePayment(formData);
            }}
            onError={(error) => {
              console.error(error);
              alert("Erro no pagamento");
            }}
            customization={{
              paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                ticket: "all",
                bankTransfer: "all", // PIX
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
