import Link from "next/link";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";

export default async function PagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <ClearCartOnMount />
      <span className="font-display text-4xl italic text-amber">
        ¡Gracias por tu compra!
      </span>
      <p className="max-w-sm text-parchment-dim">
        Mercado Pago confirmó tu pago. Te vamos a avisar por WhatsApp en
        cuanto empecemos a preparar tu pedido.
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
