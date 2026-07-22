import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="font-display text-4xl italic text-amber">404</span>
      <h1 className="font-heading text-xl text-parchment">
        Este producto ya no está disponible
      </h1>
      <p className="max-w-sm text-sm text-parchment-dim">
        Puede que se haya agotado o que el link esté mal escrito. Volvé al
        catálogo para seguir mirando.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full border border-oud-800 px-5 py-2 text-sm font-heading text-parchment transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
      >
        Ver catálogo
      </Link>
    </main>
  );
}
