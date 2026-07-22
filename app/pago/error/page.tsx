import Link from "next/link";
import { WhatsappCTA } from "@/components/WhatsappCTA";

export default function PagoErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="font-display text-4xl italic text-rose">
        El pago no se pudo procesar
      </span>
      <p className="max-w-sm text-parchment-dim">
        Podés intentar de nuevo con otro medio de pago, o escribirnos y te
        ayudamos a coordinar la compra.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/carrito"
          className="rounded-full border border-oud-800 px-5 py-2 text-sm font-heading text-parchment transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
        >
          Volver al carrito
        </Link>
        <WhatsappCTA
          message="Hola! Tuve un problema pagando mi pedido, ¿me ayudan?"
          className="rounded-full bg-amber px-5 py-2 text-sm font-heading font-semibold text-oud-950 hover:opacity-90"
        >
          Consultar por WhatsApp
        </WhatsappCTA>
      </div>
    </main>
  );
}
