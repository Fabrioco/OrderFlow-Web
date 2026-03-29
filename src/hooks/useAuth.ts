"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabase } from "@/utils/supabase/client";
import { UserRole } from "@/types/supabase";

interface AuthState {
  user: User | null;
  role: UserRole | null;       // role no tenant atual
  isAdmin: boolean;            // admin da plataforma
  loading: boolean;
}

export function useAuth(tenantId?: string): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const supabase = getSupabase();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState({ user: null, role: null, isAdmin: false, loading: false });
        return;
      }

      const isAdmin = user.user_metadata?.role === "admin";

      let role: UserRole | null = null;
      if (tenantId) {
        const { data } = await supabase
          .from("tenant_users")
          .select("role")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();
        role = (data?.role as UserRole) ?? null;
      }

      setState({ user, role, isAdmin, loading: false });
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, [tenantId]);

  return state;
}
