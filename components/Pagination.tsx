import Link from "next/link";

function buildHref(
  currentParams: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  if (currentParams.categoria) params.set("categoria", currentParams.categoria);
  if (currentParams.orden) params.set("orden", currentParams.orden);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function Pagination({
  page,
  totalPages,
  categoria,
  orden,
}: {
  page: number;
  totalPages: number;
  categoria?: string;
  orden?: string;
}) {
  if (totalPages <= 1) return null;

  const currentParams = { categoria, orden };
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      aria-label="Paginado del catálogo"
      className="flex items-center justify-center gap-4 pt-4"
    >
      <PaginationLink
        href={buildHref(currentParams, page - 1)}
        disabled={prevDisabled}
      >
        ← Anterior
      </PaginationLink>

      <span className="text-sm text-parchment-dim">
        Página {page} de {totalPages}
      </span>

      <PaginationLink
        href={buildHref(currentParams, page + 1)}
        disabled={nextDisabled}
      >
        Siguiente →
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-full border border-oud-800 px-4 py-1.5 text-sm text-parchment-dim/40">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-oud-800 px-4 py-1.5 text-sm text-parchment-dim transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
    >
      {children}
    </Link>
  );
}
