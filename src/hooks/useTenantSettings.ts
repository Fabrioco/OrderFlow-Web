// hooks/useTenantSettings.ts
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

export function useTenantSettings(slug: string) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Busca dados iniciais (Seção 4.1 do seu doc)
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single();

      setSettings(data);
      setLoading(false);
    }
    loadSettings();
  }, [slug]);

  // Função para alternar o Status Operacional (Aberto/Fechado)
  const toggleStoreStatus = async (isOpen: boolean) => {
    const { error } = await supabase
      .from("tenants")
      .update({ is_open: isOpen })
      .eq("slug", slug);

    if (!error) setSettings({ ...settings, is_open: isOpen });
    return { error };
  };

  // Atualizar dados gerais
  const updateGeneralInfo = async (formData: any) => {
    const { error } = await supabase
      .from("tenants")
      .update(formData)
      .eq("id", settings.id);

    return { error };
  };

  return { settings, loading, toggleStoreStatus, updateGeneralInfo };
}
