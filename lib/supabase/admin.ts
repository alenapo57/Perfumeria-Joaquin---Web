import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * ⚠️ Cliente de Supabase con la service_role key: BYPASSEA RLS por completo.
 *
 * Reglas de uso:
 * - Import SOLO dentro de archivos en `app/api/**` (Route Handlers) o
 *   Server Actions que ya validaron el rol admin antes de llegar acá.
 * - NUNCA importar este archivo desde un componente que se renderice
 *   en el navegador (el paquete "server-only" hace fallar el build
 *   si eso pasa, como red de seguridad extra).
 * - Se usa típicamente para: crear pedidos con precio verificado,
 *   procesar el webhook de Mercado Pago, y operaciones del panel
 *   admin después de confirmar `is_admin()`.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
