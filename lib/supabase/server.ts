import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components y Route Handlers.
 * Usa la anon key + la sesión del usuario (vía cookies), así que
 * sigue respetando RLS. Sirve para páginas que necesitan saber
 * quién está logueado (ej. el panel de admin).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component
            // (el middleware se encarga de refrescar la sesión).
          }
        },
      },
    }
  );
}
