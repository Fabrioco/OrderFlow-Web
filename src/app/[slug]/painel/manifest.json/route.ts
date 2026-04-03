import { createClient } from "@/utils/supabase/client";

// Gera um manifest.json dinâmico por tenant.
// Cada lojista instala o app com o nome e cor do próprio negócio.
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  // Busca dados básicos do tenant para personalizar o manifest
  const supabase = createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, logo_url")
    .eq("slug", slug)
    .single();

  const appName = tenant?.name
    ? `${tenant.name} — Painel`
    : "OrderFlow — Painel";

  const shortName = tenant?.name ?? "OrderFlow";

  const manifest = {
    name: appName,
    short_name: shortName,
    description: "Gerencie seus pedidos em tempo real",
    start_url: `/${slug}/painel/pedidos`,
    scope: `/${slug}/painel/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#131313",
    theme_color: "#131313",
    lang: "pt-BR",
    icons: [
      {
        src: tenant?.logo_url ?? "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: tenant?.logo_url ?? "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/painel.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Fila de pedidos ao vivo",
      },
    ],
    categories: ["food", "business"],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      // Cache de 1 hora — se o lojista mudar o nome, atualiza rápido
      "Cache-Control": "public, max-age=3600",
    },
  });
}
