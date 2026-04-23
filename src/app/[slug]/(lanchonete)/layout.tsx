import { LanchoneteClient } from "@/components/[slug]/(lanchonete)/LanchoneteClient";
import { createClient } from "@/utils/supabase/client";

export default async function LanchoneteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: tenant } = await supabase
    .from("tenants_public")
    .select("primary_color, name, logo_url")
    .eq("slug", slug)
    .single();

  const primaryColor = tenant?.primary_color ?? "#f97316";
  const tenantName = tenant?.name ?? "";
  const tenantLogoUrl = tenant?.logo_url ?? null;

  return (
    <LanchoneteClient
      slug={slug}
      primaryColor={primaryColor}
      tenantName={tenantName}
      tenantLogoUrl={tenantLogoUrl}
    >
      {children}
    </LanchoneteClient>
  );
}
