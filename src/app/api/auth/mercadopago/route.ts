// app/api/auth/mercadopago/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant ID is required" },
      { status: 400 },
    );

  const MP_CLIENT_ID = process.env.MP_CLIENT_ID;
  const REDIRECT_URI = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_URL}/api/mp/callback`,
  );

  // O 'state' é o segredo: enviamos o ID do restaurante aqui
  const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${REDIRECT_URI}`;

  return NextResponse.redirect(authUrl);
}
