import Link from "next/link";

export default async function PagoPendientePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="font-display text-4xl italic text-rose">
        Pago pendiente
      </span>
      <p className="max-w-sm text-parchment-dim">
        Tu pago está pendiente de aprobación (por ejemplo, si pagaste por
        transferencia o en efectivo). Te confirmamos apenas se acredite.
      </p>
      {order && (
        <p className="text-xs text-parchment-dim">
          Número de pedido: {order.slice(0, 8)}
        </p>
      )}
      <Link
        href="/"
        className="mt-2 rounded-full border border-oud-800 px-5 py-2 text-sm font-heading text-parchment transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
      >
        Volver al catálogo
      </Link>
    </main>
  );
}
