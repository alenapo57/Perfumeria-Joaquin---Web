import Link from "next/link";
import { getAllProductsForAdmin, PAGE_SIZE } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { CATEGORY_META } from "@/lib/categories";
import { toggleActiveAction } from "./productos/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina } = await searchParams;
  const page = Math.max(1, parseInt(pagina ?? "1", 10) || 1);

  const { products, total } = await getAllProductsForAdmin({ page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold text-parchment">
          Productos ({total})
        </h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-full bg-amber px-4 py-1.5 text-sm font-heading font-semibold text-oud-950 hover:opacity-90"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-oud-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-oud-800 text-left text-parchment-dim">
              <th className="px-3 py-2 font-heading font-medium">Producto</th>
              <th className="px-3 py-2 font-heading font-medium">Categoría</th>
              <th className="px-3 py-2 font-heading font-medium">Precio</th>
              <th className="px-3 py-2 font-heading font-medium">Stock</th>
              <th className="px-3 py-2 font-heading font-medium">Estado</th>
              <th className="px-3 py-2 font-heading font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-oud-800/50">
                <td className="px-3 py-2 text-parchment">
                  {product.name}
                  {product.brand && (
                    <span className="ml-1 text-xs text-parchment-dim">
                      · {product.brand}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-parchment-dim">
                  {product.category_slug
                    ? CATEGORY_META[product.category_slug]?.label
                    : "—"}
                </td>
                <td className="px-3 py-2 text-amber">
                  {formatPrice(product.price)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      product.stock === 0 ? "text-rose" : "text-parchment-dim"
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      product.active ? "text-amber-bright" : "text-parchment-dim"
                    }
                  >
                    {product.active ? "Visible" : "Oculto"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/productos/${product.id}/editar`}
                      className="text-xs text-parchment-dim transition-colors hover:text-amber-bright"
                    >
                      Editar
                    </Link>
                    <form
                      action={toggleActiveAction.bind(
                        null,
                        product.id,
                        !product.active
                      )}
                    >
                      <button
                        type="submit"
                        className="text-xs text-parchment-dim transition-colors hover:text-amber-bright"
                      >
                        {product.active ? "Ocultar" : "Mostrar"}
                      </button>
                    </form>
                    <DeleteProductButton id={product.id} productName={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-2">
          <Link
            href={`/admin?pagina=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-full border border-oud-800 px-4 py-1.5 text-sm ${
              page <= 1
                ? "pointer-events-none text-parchment-dim/40"
                : "text-parchment-dim hover:text-amber-bright"
            }`}
          >
            ← Anterior
          </Link>
          <span className="text-sm text-parchment-dim">
            Página {page} de {totalPages}
          </span>
          <Link
            href={`/admin?pagina=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-full border border-oud-800 px-4 py-1.5 text-sm ${
              page >= totalPages
                ? "pointer-events-none text-parchment-dim/40"
                : "text-parchment-dim hover:text-amber-bright"
            }`}
          >
            Siguiente →
          </Link>
        </nav>
      )}
    </div>
  );
}
