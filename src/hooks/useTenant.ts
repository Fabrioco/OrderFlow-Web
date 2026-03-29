"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/utils/supabase/client";
import { TenantPublic } from "@/types/supabase";

interface UseTenantResult {
  tenant: TenantPublic | null;
  loading: boolean;
  notFound: boolean;
}

// Cache em memória para evitar fetch repetido na mesma sessão
const cache = new Map<string, TenantPublic>();

export function useTenant(slug: string): UseTenantResult {
  const [tenant, setTenant] = useState<TenantPublic | null>(
    cache.get(slug) ?? null,
  );
  const [loading, setLoading] = useState(!cache.has(slug));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (cache.has(slug)) return;

    const supabase = getSupabase();
    setLoading(true);

    supabase
      .from("tenants_public")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          cache.set(slug, data as TenantPublic);
          setTenant(data as TenantPublic);
        }
        setLoading(false);
      });
  }, [slug]);

  return { tenant, loading, notFound };
}
