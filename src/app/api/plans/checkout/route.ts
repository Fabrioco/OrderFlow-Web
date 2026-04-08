import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { PLAN_PRICES, PLAN_LABELS, PlanType } from "@/lib/plan";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { tenantId, plan, mp_form_data } = await req.json();

    console.log("BODY:", {
      tenantId,
      plan,
      mp_form_data,
    });

    // ✅ Validação básica
    if (!tenantId || !plan) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    // ✅ Validação de plano
    if (!(plan in PLAN_PRICES)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const price = PLAN_PRICES[plan as Exclude<PlanType, "free">];

    // ✅ Extrai dados do Payment Brick
    const formData = mp_form_data?.formData;

    if (!formData?.token) {
      console.error("Token ausente:", mp_form_data);
      return NextResponse.json(
        { error: "Token de pagamento inválido." },
        { status: 400 },
      );
    }

    const payer = formData.payer;

    if (!payer?.email) {
      return NextResponse.json(
        { error: "Email obrigatório." },
        { status: 400 },
      );
    }

    const identification = payer.identification
      ? {
          type: payer.identification.type || "CPF",
          number: payer.identification.number,
        }
      : undefined;

    // 🔌 Cria pagamento no Mercado Pago
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `plan-${tenantId}-${plan}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: price,
        token: formData.token,
        installments: formData.installments || 1,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        payer: {
          email: payer.email,
          identification,
        },
        external_reference: `plan:${tenantId}:${plan}`,
        description: `OrderFlow ${PLAN_LABELS[plan as PlanType]} — 30 dias`,
      }),
    });

    const mpPayment = await mpRes.json();

    console.log("MP RESPONSE:", mpPayment);

    // ❌ erro vindo do MP
    if (!mpRes.ok) {
      console.error("Erro MP:", mpPayment);
      return NextResponse.json(
        { error: "Erro ao processar pagamento." },
        { status: 400 },
      );
    }

    // ❌ pagamento recusado
    if (mpPayment.status === "rejected") {
      return NextResponse.json(
        { error: "Pagamento recusado." },
        { status: 400 },
      );
    }

    // ✅ aprovação imediata
    if (mpPayment.status === "approved") {
      await activatePlan(tenantId, plan as PlanType, String(mpPayment.id));
    }

    return NextResponse.json({
      status: mpPayment.status,
      paymentId: mpPayment.id,
    });
  } catch (err) {
    console.error("PLAN CHECKOUT ERROR:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

async function activatePlan(
  tenantId: string,
  plan: PlanType,
  mpPaymentId: string,
) {
  try {
    // 🔁 Cancela plano anterior
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", tenantId)
      .eq("status", "active");

    // ➕ Cria nova subscription
    await supabaseAdmin.from("subscriptions").insert({
      tenant_id: tenantId,
      plan,
      status: "active",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      mp_payment_id: mpPaymentId,
    });

    // 🏢 Atualiza tenant
    await supabaseAdmin
      .from("tenants")
      .update({
        plan,
        plan_expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        is_blocked: false,
      })
      .eq("id", tenantId);

    console.log(`Plano ${plan} ativado para tenant ${tenantId}`);
  } catch (err) {
    console.error("ACTIVATE PLAN ERROR:", err);
  }
}
