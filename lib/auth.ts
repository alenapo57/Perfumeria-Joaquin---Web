import { createClient } from "@/lib/supabase/server";

/**
 * Verifica que haya una sesión activa Y que ese usuario esté en
 * admin_users. Usa getClaims() en vez de getUser(): valida el JWT
 * localmente (rápido) y, si el token está por vencer, lo refresca
 * automáticamente — por eso no hace falta un middleware/proxy aparte
 * solo para mantener la sesión viva.
 *
 * Devuelve null si no hay sesión o si el usuario no es admin. Nunca
 * confía en nada del lado del cliente: is_admin() corre en la base
 * de datos contra la tabla real admin_users.
 */
export async function getAdminSession(): Promise<{
  userId: string;
  email: string | null;
} | null> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData) return null;

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || !isAdmin) return null;

  return {
    userId: claimsData.claims.sub,
    email: (claimsData.claims.email as string) ?? null,
  };
}
