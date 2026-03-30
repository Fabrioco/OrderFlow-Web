import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Para Server Components, Actions e Route Handlers
export async function createServerSupabase() {
  const cookieStore = await cookies();

  // Aqui você deve usar a PUBLISHABLE KEY (sb_publishable...)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: any) => {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }: {
                name: string;
                value: string;
                options?: any;
              }) => cookieStore.set(name, value, options),
            );
          } catch {
            // Seguro ignorar em Server Components
          }
        },
      },
    },
  );
}

// Para operações de Admin (Bypassa RLS)
export function createAdminSupabase() {
  // Aqui você usa a SECRET KEY (sb_secret...)
  // Importante: createClient aqui vem de @supabase/supabase-js
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
