import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { tenantId, order_data, items, use_mp, mp_form_data } = body;

    console.log("🧾 CHECKOUT START");
    console.log("tenantId:", tenantId);
    console.log("items:", items);

    /* ───────────────────────── VALIDATION ───────────────────────── */

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId é obrigatório." },
        { status: 400 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });
    }

    for (const item of items) {
      if (!item.id) {
        console.error("❌ Item sem ID:", item);
        return NextResponse.json(
          { error: "Item inválido (sem ID)." },
          { status: 400 },
        );
      }
    }

    const customerPhone = order_data.customer_phone?.replace(/\D/g, "");
    const customerName = order_data.customer_name?.trim() || "Cliente";

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Telefone obrigatório." },
        { status: 400 },
      );
    }

    /* ───────────────────────── CUSTOMER ───────────────────────── */

    const { data: customer, error: customerErr } = await supabaseAdmin
      .from("customers")
      .upsert(
        {
          phone: customerPhone,
          name: customerName,
          tenant_id: tenantId,
        },
        { onConflict: "phone, tenant_id" },
      )
      .select()
      .single();

    if (customerErr || !customer) {
      console.error("❌ CUSTOMER ERROR:", customerErr);
      return NextResponse.json(
        { error: "Erro ao processar cliente." },
        { status: 500 },
      );
    }

    /* ───────────────────────── VALIDATE PRODUCTS ───────────────────────── */

    const productIds = items.map((i: any) => i.id);

    console.log("🔍 productIds:", productIds);

    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, price, tenant_id")
      .in("id", productIds)
      .eq("tenant_id", tenantId);

    console.log("📦 dbProducts:", dbProducts);
    console.log("⚠️ prodErr:", prodErr);

    if (prodErr) {
      return NextResponse.json(
        { error: "Erro ao consultar produtos." },
        { status: 500 },
      );
    }

    if (!dbProducts || dbProducts.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto encontrado." },
        { status: 400 },
      );
    }

    const priceMap = new Map(dbProducts.map((p) => [p.id, p.price]));

    let safeSubtotal = 0;

    for (const item of items) {
      const dbPrice = priceMap.get(item.id);

      if (!dbPrice) {
        console.error("❌ Produto não encontrado no tenant:", item.id);
        return NextResponse.json(
          { error: "Produto inválido." },
          { status: 400 },
        );
      }

      safeSubtotal += dbPrice * item.quantity;
    }

    console.log("💰 safeSubtotal:", safeSubtotal);

    /* ───────────────────────── DELIVERY ───────────────────────── */

    const { data: zone } = await supabaseAdmin
      .from("delivery_zones")
      .select("fee")
      .eq("tenant_id", tenantId)
      .eq("neighborhood", order_data.delivery_address?.neighborhood)
      .single();

    const safeDeliveryFee = zone?.fee ?? 0;
    const safeTotal = safeSubtotal + safeDeliveryFee;

    console.log("🚚 deliveryFee:", safeDeliveryFee);
    console.log("💳 total:", safeTotal);

    /* ───────────────────────── CREATE ORDER ───────────────────────── */

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        customer_id: customer.id,
        status: "pending",
        payment_method: order_data.payment_method,
        payment_status: use_mp ? "pending" : "not_required",
        subtotal: safeSubtotal,
        delivery_fee: safeDeliveryFee,
        total: safeTotal,
        delivery_address: order_data.delivery_address,
        observation: order_data.observation || null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("❌ ORDER ERROR:", orderErr);
      return NextResponse.json(
        { error: "Erro ao criar pedido." },
        { status: 500 },
      );
    }

    /* ───────────────────────── ORDER ITEMS ───────────────────────── */

    const orderItems = items.map((i: any) => ({
      order_id: order.id,
      product_id: i.id,
      product_name: i.title,
      unit_price: priceMap.get(i.id),
      quantity: i.quantity,
      selected_addons: i.selected_addons || null,
      observation: i.observation || null,
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      console.error("❌ ITEMS ERROR:", itemsErr);

      await supabaseAdmin
        .from("orders")
        .update({
          status: "canceled",
          payment_status: "failed",
        })
        .eq("id", order.id);

      return NextResponse.json(
        { error: "Erro ao salvar itens." },
        { status: 500 },
      );
    }

    /* ───────────────────────── MERCADO PAGO ───────────────────────── */

    if (use_mp) {
      console.log("💳 Iniciando pagamento MP");

      if (!mp_form_data?.token) {
        return NextResponse.json({ error: "Token inválido." }, { status: 400 });
      }

      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("mp_access_token")
        .eq("id", tenantId)
        .single();

      if (!tenant?.mp_access_token) {
        return NextResponse.json(
          { error: "MP não configurado." },
          { status: 400 },
        );
      }

      // ───────────────────────── VALIDATE PAYER ─────────────────────────

      const payer = mp_form_data?.payer;

      if (!payer) {
        return NextResponse.json(
          { error: "Dados do pagador não enviados." },
          { status: 400 },
        );
      }

      if (!payer.email) {
        return NextResponse.json(
          { error: "Email do pagador é obrigatório." },
          { status: 400 },
        );
      }

      if (!payer.identification?.number) {
        return NextResponse.json(
          { error: "CPF do pagador é obrigatório." },
          { status: 400 },
        );
      }

      if (!order_data.customer_name) {
        return NextResponse.json(
          { error: "Nome do cliente é obrigatório." },
          { status: 400 },
        );
      }

      // Sanitização básica
      const firstName = order_data.customer_name.split(" ")[0];
      const lastName =
        order_data.customer_name.split(" ").slice(1).join(" ") || "-";

      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tenant.mp_access_token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": order.id,
        },
        body: JSON.stringify({
          transaction_amount: safeTotal,
          token: mp_form_data.token,
          installments: mp_form_data.installments ?? 1,
          payment_method_id: mp_form_data.payment_method_id,
          issuer_id: mp_form_data.issuer_id,
          payer: {
            email: payer.email,
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: payer.identification.type || "CPF",
              number: payer.identification.number,
            },
          },
          external_reference: order.id,
          description: `Pedido #${order.id}`,
        }),
      });
      const mpPayment = await mpRes.json();

      console.log("📡 MP RESPONSE:", mpPayment);

      if (!mpRes.ok) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: "canceled",
            payment_status: "failed",
          })
          .eq("id", order.id);

        return NextResponse.json(
          { error: "Pagamento recusado." },
          { status: 400 },
        );
      }

      await supabaseAdmin
        .from("orders")
        .update({
          mp_payment_id: String(mpPayment.id),
          payment_status: mpPayment.status,
        })
        .eq("id", order.id);

      if (mpPayment.status === "rejected") {
        return NextResponse.json(
          { error: "Pagamento recusado." },
          { status: 400 },
        );
      }

      return NextResponse.json({
        orderId: order.id,
        payment_status: mpPayment.status,
      });
    }

    /* ───────────────────────── OFFLINE ───────────────────────── */

    return NextResponse.json({
      orderId: order.id,
    });
  } catch (error) {
    console.error("🔥 CHECKOUT ERROR:", error);

    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
