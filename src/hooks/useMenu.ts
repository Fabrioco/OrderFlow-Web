import { Addon, DeliveryZone, Product, Tenant } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export function useMenuData(slug: string) {
  const supabase = createClient();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!tenantData) return;

      setTenant(tenantData);

      const [{ data: prods }, { data: dz }, { data: ads }] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("delivery_zones").select("*"),
        supabase.from("addons").select("*"),
      ]);

      setProducts(prods ?? []);
      setZones(dz ?? []);
      setAddons(ads ?? []);
      setLoading(false);
    }

    if (slug) fetchData();
  }, [slug]);

  return { tenant, products, zones, addons, loading };
}
