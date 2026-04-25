import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { tenantId, order_data, items } = body;

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
      return NextResponse.json(
        { error: "Erro ao processar cliente." },
        { status: 500 },
      );
    }

    const productIds = items.map((i: any) => i.id);

    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, price, tenant_id")
      .in("id", productIds)
      .eq("tenant_id", tenantId);

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
        return NextResponse.json(
          { error: "Produto inválido." },
          { status: 400 },
        );
      }

      const addonsTotal =
        item.selected_addons?.reduce(
          (sum: number, addon: any) => sum + Number(addon.price),
          0,
        ) ?? 0;

      safeSubtotal += (Number(dbPrice) + addonsTotal) * Number(item.quantity);
    }

    const { data: zone } = await supabaseAdmin
      .from("delivery_zones")
      .select("fee")
      .eq("tenant_id", tenantId)
      .eq("neighborhood", order_data.delivery_address?.neighborhood)
      .single();

    const safeDeliveryFee = zone?.fee ?? 0;
    const safeTotal = safeSubtotal + safeDeliveryFee;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        customer_id: customer.id,
        status: "pending",
        payment_method: order_data.payment_method,
        payment_status: "not_required",
        subtotal: safeSubtotal,
        delivery_fee: safeDeliveryFee,
        total: safeTotal,
        delivery_address: order_data.delivery_address,
        observation: order_data.observation || null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Erro ao criar pedido." },
        { status: 500 },
      );
    }

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

    return NextResponse.json({
      orderId: order.id,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
