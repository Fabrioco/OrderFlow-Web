import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Pegamos os valores e removemos possíveis espaços em branco/quebras de linha
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Verificação de segurança em desenvolvimento
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL ou Anon Key não encontradas no .env.local");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton para evitar múltiplas instâncias no client
let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (typeof window === "undefined") return createClient(); // Fallback para SSR

  if (!client) {
    client = createClient();
  }
  return client;
}
