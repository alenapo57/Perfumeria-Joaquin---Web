import { Suspense } from "react";
import {
  getCategories,
  getProducts,
  getFreeShippingThreshold,
  PAGE_SIZE,
  type SortOption,
} from "@/lib/products";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { SiteHeader } from "@/components/SiteHeader";

// Los productos se editan seguido desde el panel de admin; nunca
// queremos que un cliente vea el catálogo con datos viejos en caché.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
    orden?: string;
    pagina?: string;
  }>;
}) {
  const { categoria, orden, pagina } = await searchParams;
  const page = Math.max(1, parseInt(pagina ?? "1", 10) || 1);

  const [categories, { products, total }, freeShippingThreshold] =
    await Promise.all([
      getCategories(),
      getProducts({
        categorySlug: categoria,
        sort: (orden as SortOption) ?? "price_desc",
        page,
      }),
      getFreeShippingThreshold(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <SiteHeader freeShippingThreshold={freeShippingThreshold} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Suspense fallback={null}>
          <CategoryFilterBar categories={categories} />
        </Suspense>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-oud-800 py-16 text-center">
            <p className="font-heading text-parchment">
              No hay productos en esta categoría todavía.
            </p>
            <p className="text-sm text-parchment-dim">
              Probá con otra categoría o sacá el filtro.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-parchment-dim">
              {total} producto{total !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              categoria={categoria}
              orden={orden}
            />
          </>
        )}
      </main>

      <footer className="border-t border-oud-800 py-8 text-center text-sm text-parchment-dim">
        Perfumería Joaquín · Sarmiento 625, San Carlos de Bolívar
      </footer>
    </>
  );
}
