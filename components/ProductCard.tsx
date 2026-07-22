import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { getCategoryAccent } from "@/lib/categories";
import { PerfumeGlyph } from "@/components/PerfumeGlyph";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const accent = getCategoryAccent(product.category_slug);

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-oud-900 transition-colors hover:bg-oud-800"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-oud-950/40">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <PerfumeGlyph accent={accent} className="h-20 w-20 transition-transform group-hover:scale-105" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brand && (
          <span className="font-heading text-xs uppercase tracking-wide text-parchment-dim">
            {product.brand}
          </span>
        )}

        <h3 className="font-heading text-sm font-medium leading-snug text-parchment">
          {product.name}
        </h3>

        {product.ml && (
          <span className="text-xs text-parchment-dim">{product.ml}ml</span>
        )}

        <div className="mt-auto flex flex-col gap-0.5 pt-2">
          <span className="font-heading text-lg font-bold text-amber">
            {formatPrice(product.price)}
          </span>
          {product.installments_enabled && (
            <span className="text-xs text-rose">Hasta 3 cuotas sin interés</span>
          )}
        </div>
      </div>
    </Link>
  );
}
