import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Client com SERVICE_ROLE_KEY para ignorar RLS e operar como sistema
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { tenantId, order_data, items, use_mp, mp_form_data } =
      await req.json();

    // ── 1. VALIDAÇÕES BÁSICAS ────────────────────────────────────
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId é obrigatório." },
        { status: 400 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "O pedido precisa ter ao menos um item." },
        { status: 400 },
      );
    }

    // ── 2. CLIENTE (CUSTOMER) ────────────────────────────────────
    const customerPhone = order_data.customer_phone?.replace(/\D/g, "");
    const customerName = order_data.customer_name?.trim() || "Cliente";

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Telefone do cliente é obrigatório." },
        { status: 400 },
      );
    }

    // Upsert: encontra pelo telefone+tenant ou cria novo
    const { data: customer, error: customerErr } = await supabaseAdmin
      .from("customers")
      .upsert(
        { phone: customerPhone, name: customerName, tenant_id: tenantId },
        { onConflict: "phone, tenant_id" },
      )
      .select()
      .single();

    if (customerErr || !customer) {
      console.error("Erro ao processar cliente:", customerErr);
      return NextResponse.json(
        { error: "Falha ao identificar cliente." },
        { status: 500 },
      );
    }

    // ── 3. CRIAÇÃO DO PEDIDO ─────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        customer_id: customer.id,
        status: "pending",
        payment_method: order_data.payment_method,
        // Cartão online fica "pending" até o webhook confirmar.
        // PIX e dinheiro não precisam de confirmação online.
        payment_status: use_mp ? "pending" : "not_required",
        subtotal: Number(order_data.subtotal),
        delivery_fee: Number(order_data.delivery_fee),
        total: Number(order_data.total),
        delivery_address: order_data.delivery_address,
        observation: order_data.observation || null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("Erro ao criar pedido:", orderErr);
      return NextResponse.json(
        { error: "Erro ao salvar pedido no banco." },
        { status: 500 },
      );
    }

    // ── 4. ITENS DO PEDIDO ───────────────────────────────────────
    const orderItems = items.map((i: any) => {
      // Criamos um objeto novo e limpo, apenas com o que existe no banco
      const itemToInsert = {
        order_id: order.id,
        product_id: i.id,
        product_name: i.title,
        unit_price: Number(i.unit_price),
        quantity: Number(i.quantity),
        selected_addons: i.selected_addons || null,
        observation: i.observation || null,
      };
      return itemToInsert;
    });

    console.log("Enviando para order_items:", orderItems); // Debug para ver o objeto final

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      console.error("ERRO_DETALHADO_SUPABASE_ITEMS:", itemsErr);

      // Se der erro nos itens, removemos o pedido para evitar lixo
      await supabaseAdmin.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: `Erro nos itens: ${itemsErr.message}` },
        { status: 500 },
      );
    }

    // ── 5. PAGAMENTO DIRETO VIA MERCADO PAGO (cartão inline) ─────
    if (use_mp && mp_form_data) {
      const { data: tenant, error: tenantErr } = await supabaseAdmin
        .from("tenants")
        .select("mp_access_token")
        .eq("id", tenantId)
        .single();

      if (tenantErr || !tenant?.mp_access_token) {
        return NextResponse.json(
          { error: "Lojista não configurou o Mercado Pago." },
          { status: 400 },
        );
      }

      // Cria o pagamento direto com o token gerado pelo brick no frontend.
      // O token já tem os dados do cartão tokenizados — nunca tocamos no número.
      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tenant.mp_access_token}`,
          "Content-Type": "application/json",
          // Idempotency key evita cobranças duplicadas em caso de retry
          "X-Idempotency-Key": order.id,
        },
        body: JSON.stringify({
          transaction_amount: Number(order_data.total),
          token: mp_form_data.token,
          installments: mp_form_data.installments ?? 1,
          payment_method_id: mp_form_data.payment_method_id,
          issuer_id: mp_form_data.issuer_id,
          payer: {
            email: mp_form_data.payer?.email,
            identification: {
              type: mp_form_data.payer?.identification?.type,
              number: mp_form_data.payer?.identification?.number,
            },
          },
          external_reference: order.id, // usado no webhook para atualizar o pedido
          description: `Pedido OrderFlow #${order.id.slice(0, 8)}`,
          statement_descriptor: "OrderFlow",
        }),
      });

      const mpPayment = await mpRes.json();

      if (!mpRes.ok) {
        console.error("Erro na API do Mercado Pago:", mpPayment);
        // Remove o pedido se o pagamento falhou antes de qualquer cobrança
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          {
            error:
              mpPayment?.message ??
              "Erro ao processar pagamento. Verifique os dados do cartão.",
          },
          { status: 400 },
        );
      }

      // Atualiza o pedido com o ID do pagamento e o status retornado pelo MP
      await supabaseAdmin
        .from("orders")
        .update({
          mp_payment_id: String(mpPayment.id),
          payment_status: mpPayment.status, // approved | in_process | rejected
        })
        .eq("id", order.id);

      // Pagamento rejeitado — informa o cliente
      if (mpPayment.status === "rejected") {
        return NextResponse.json(
          {
            error:
              "Pagamento recusado. Tente outro cartão ou outra forma de pagamento.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        orderId: order.id,
        payment_status: mpPayment.status,
      });
    }

    // ── 6. PEDIDO SEM PAGAMENTO ONLINE (PIX / dinheiro na entrega)
    return NextResponse.json({ orderId: order.id });
  } catch (error: any) {
    console.error("ERRO_FATAL_CHECKOUT:", error);
    return NextResponse.json(
      { error: "Erro interno no checkout." },
      { status: 500 },
    );
  }
}
