import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getFreeShippingThreshold } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { getCategoryAccent, CATEGORY_META } from "@/lib/categories";
import { PerfumeGlyph } from "@/components/PerfumeGlyph";
import { WhatsappCTA } from "@/components/WhatsappCTA";
import { SiteHeader } from "@/components/SiteHeader";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Producto no encontrado" };

  const description =
    product.description ?? `${product.brand ?? ""} ${product.ml ?? ""}ml`.trim();

  return {
    title: `${product.name} — Perfumería Joaquín`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, freeShippingThreshold] = await Promise.all([
    getProductBySlug(slug),
    getFreeShippingThreshold(),
  ]);

  if (!product) notFound();

  const accent = getCategoryAccent(product.category_slug);
  const categoryLabel = product.category_slug
    ? CATEGORY_META[product.category_slug]?.label
    : null;

  return (
    <>
      <SiteHeader freeShippingThreshold={freeShippingThreshold} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="w-fit text-sm text-parchment-dim transition-colors hover:text-amber-bright"
        >
          ← Volver al catálogo
        </Link>

        <div className="grid gap-8 sm:grid-cols-2">
          <div
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-oud-900"
            style={{ borderLeft: `3px solid ${accent}` }}
          >
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <PerfumeGlyph accent={accent} className="h-40 w-40" />
            )}
          </div>

          <div className="flex flex-col gap-3">
            {categoryLabel && (
              <span
                className="w-fit rounded-full border px-3 py-1 text-xs font-heading"
                style={{ borderColor: accent, color: accent }}
              >
                {categoryLabel}
              </span>
            )}

            <h1 className="font-heading text-2xl font-bold leading-tight text-parchment">
              {product.name}
            </h1>

            <div className="text-sm text-parchment-dim">
              {[product.brand, product.ml ? `${product.ml}ml` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <span className="font-heading text-3xl font-bold text-amber">
                {formatPrice(product.price)}
              </span>
              {product.installments_enabled && (
                <span className="text-sm text-rose">
                  Hasta 3 cuotas sin interés
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-2 text-sm leading-relaxed text-parchment-dim">
                {product.description}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton
                productId={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                ml={product.ml}
                imageUrl={product.image_url}
                stock={product.stock}
              />
              <WhatsappCTA
                message={`Hola! Quería consultar por ${product.name}.`}
                className="flex-1 rounded-lg border border-oud-800 px-6 py-3 text-center font-heading text-parchment transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
              >
                Consultar por WhatsApp
              </WhatsappCTA>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
