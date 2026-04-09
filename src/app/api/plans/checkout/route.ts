// app/api/plans/checkout/route.ts
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  const { plan, tenantId, slug } = await req.json();

  // Mapeie os preços no servidor por segurança
  const planPrices = { essencial: 19.9, basico: 39.9, pro: 79.9 };
  const amount = planPrices[plan as keyof typeof planPrices];

  try {
    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            id: plan,
            title: `Plano ${plan.toUpperCase()} - OrderFlow`,
            quantity: 1,
            unit_price: amount,
            currency_id: "BRL",
          },
        ],
        metadata: { tenant_id: tenantId, plan_type: plan },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL}/${slug}/upgrade/success`,
          failure: `${process.env.NEXT_PUBLIC_URL}/${slug}/upgrade`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({ url: preference.init_point });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao gerar checkout" },
      { status: 500 },
    );
  }
}
