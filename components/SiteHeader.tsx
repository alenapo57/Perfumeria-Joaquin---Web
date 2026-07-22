import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { WhatsappCTA } from "@/components/WhatsappCTA";
import { CartIcon } from "@/components/CartIcon";

export function SiteHeader({
  freeShippingThreshold,
}: {
  freeShippingThreshold: number | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-oud-800 bg-oud-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-2xl italic text-parchment">
          Perfumería Joaquín
        </Link>
        <div className="flex items-center gap-3">
          <WhatsappCTA
            message="Hola! Quería hacer una consulta."
            className="rounded-full border border-oud-800 px-4 py-2 text-sm font-heading text-parchment-dim transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
          >
            WhatsApp
          </WhatsappCTA>
          <CartIcon />
        </div>
      </div>
      {freeShippingThreshold != null && (
        <div className="bg-oud-900 py-1.5 text-center text-xs text-parchment-dim">
          Envío gratis en San Carlos de Bolívar · Gratis a todo el país en
          compras superiores a {formatPrice(freeShippingThreshold)}
        </div>
      )}
    </header>
  );
}
