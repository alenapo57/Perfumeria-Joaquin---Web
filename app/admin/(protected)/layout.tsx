import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { signOutAction } from "./actions";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // No hay sesión, o el usuario logueado no está en admin_users:
  // en ambos casos, afuera. No se distingue el motivo en la UI para
  // no dar pistas de qué cuentas existen.
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-oud-800 bg-oud-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-heading text-sm font-semibold text-parchment"
            >
              Panel — Perfumería Joaquín
            </Link>
            <Link
              href="/admin/productos/nuevo"
              className="text-sm text-parchment-dim transition-colors hover:text-amber-bright"
            >
              + Nuevo producto
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {session.email && (
              <span className="hidden text-xs text-parchment-dim sm:inline">
                {session.email}
              </span>
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-oud-800 px-3 py-1.5 text-xs text-parchment-dim transition-colors hover:border-rose/50 hover:text-rose"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
