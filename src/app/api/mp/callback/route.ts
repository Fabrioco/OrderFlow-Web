// app/api/mp/callback/route.ts
import { NextResponse } from "next/server";
// No topo do seu callback/route.ts
import { createClient } from "@supabase/supabase-js"; // Use o pacote direto se preferir

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usa a chave mestra para o server-side
);
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tenantId = searchParams.get("state"); // Recuperamos o ID que enviamos no passo 2

  if (!code || !tenantId) return NextResponse.redirect("/erro-na-conexao");

  // 1. Trocar o código pelo Access Token via API do Mercado Pago
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: process.env.MP_CLIENT_ID!,
      client_secret: process.env.MP_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/mp/callback`,
    }),
  });

  const credentials = await response.json();

  if (credentials.access_token) {
    // 2. Salvar as credenciais no banco (Seção 4.1 do seu doc)
    // IMPORTANTE: Use criptografia ou colunas protegidas para o access_token
    // No seu app/api/mp/callback/route.ts
    const { data: tenantData, error: updateError } = await supabase
      .from("tenants")
      .update({
        mp_access_token: credentials.access_token,
        mp_public_key: credentials.public_key,
        mp_user_id: String(credentials.user_id),
        mp_connected_at: new Date().toISOString(), // Usa a coluna que já existe
        // Remova a linha 'is_connected_mp: true' daqui se não for criar a coluna
      })
      .eq("id", tenantId)
      .select("slug")
      .single();

    if (updateError || !tenantData) {
      console.log(updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/erro-no-banco`,
      );
    }

    // 3. Redirecionar para o caminho dinâmico correto
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/${tenantData.slug}/painel/configuracoes?success=true`,
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_URL}/painel/configuracoes?error=mp_auth_failed`,
  );
}
