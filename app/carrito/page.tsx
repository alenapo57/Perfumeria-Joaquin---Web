import { getShippingRules, getFreeShippingThreshold } from "@/lib/products";
import { SiteHeader } from "@/components/SiteHeader";
import { CartView } from "@/components/CartView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tu carrito — Perfumería Joaquín",
};

export default async function CarritoPage() {
  const [shippingRules, freeShippingThreshold] = await Promise.all([
    getShippingRules(),
    getFreeShippingThreshold(),
  ]);

  return (
    <>
      <SiteHeader freeShippingThreshold={freeShippingThreshold} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-4 font-heading text-lg font-semibold text-parchment">
          Tu carrito
        </h1>
        <CartView shippingRules={shippingRules} />
      </main>
    </>
  );
}
