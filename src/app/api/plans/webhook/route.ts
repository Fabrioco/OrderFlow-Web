import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const body = await req.json();
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");

  if (signature && requestId) {
    const secret = process.env.MP_WEBHOOK_SECRET!;
    const [tsPart, v1Part] = signature.split(",");
    const ts = tsPart?.split("=")?.[1];
    const v1 = v1Part?.split("=")?.[1];
    const manifest = `id:${body?.data?.id};request-id:${requestId};ts:${ts};`;
    const hmac = createHmac("sha256", secret).update(manifest).digest("hex");
    if (hmac !== v1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const paymentId = body?.data?.id;
    const type = body?.type;

    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ received: true });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } },
    );

    const payment = await mpRes.json();
    if (!mpRes.ok) return NextResponse.json({ received: true });

    const ref: string = payment.external_reference ?? "";

    // Ignora se não for pagamento de plano
    if (!ref.startsWith("plan:")) {
      return NextResponse.json({ received: true });
    }

    const [, tenantId, plan] = ref.split(":");

    if (!tenantId || !plan) {
      return NextResponse.json({ received: true });
    }

    if (payment.status === "approved") {
      // Cancela subscription anterior
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      // Cria nova subscription
      await supabaseAdmin.from("subscriptions").insert({
        tenant_id: tenantId,
        plan,
        status: "active",
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        mp_payment_id: String(payment.id),
      });

      // Ativa plano no tenant
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
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("PLAN WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
