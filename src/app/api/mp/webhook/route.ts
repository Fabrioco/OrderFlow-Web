import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("MP WEBHOOK RECEIVED:", body);

    const paymentId = body?.data?.id;
    const type = body?.type;

    // Só processa eventos de pagamento
    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ received: true });
    }

    /* ───────────────────────── GET PAYMENT FROM MP ───────────────────────── */

    // ⚠️ IMPORTANTE:
    // Aqui você precisa de um access_token global (ou mapear por tenant)
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      },
    );

    const payment = await mpRes.json();

    if (!mpRes.ok) {
      console.error("Erro ao buscar pagamento:", payment);
      return NextResponse.json({ error: "MP fetch error" }, { status: 500 });
    }

    /* ───────────────────────── EXTRACT DATA ───────────────────────── */

    const orderId = payment.external_reference;

    if (!orderId) {
      console.warn("Pagamento sem external_reference:", paymentId);
      return NextResponse.json({ received: true });
    }

    const paymentStatus = payment.status; // approved | rejected | pending | in_process

    /* ───────────────────────── MAP STATUS ───────────────────────── */

    let orderStatus = "pending";

    switch (paymentStatus) {
      case "approved":
        orderStatus = "paid";
        break;
      case "rejected":
      case "cancelled":
        orderStatus = "canceled";
        break;
      case "in_process":
      case "pending":
      default:
        orderStatus = "pending";
        break;
    }

    /* ───────────────────────── UPDATE ORDER ───────────────────────── */

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("Erro ao atualizar pedido:", updateErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    console.log("Pedido atualizado:", orderId, paymentStatus);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);

    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
