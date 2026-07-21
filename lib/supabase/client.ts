import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en Client Components (navegador).
 * Usa la anon key: respeta RLS, así que solo puede leer lo que las
 * policies permiten (productos activos, categorías, etc).
 * NUNCA importar la service_role key acá.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
