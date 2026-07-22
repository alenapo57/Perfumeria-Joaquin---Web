"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_META } from "@/lib/categories";
import type { Category } from "@/lib/products";

export function CategoryFilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("categoria") ?? "";
  const activeSort = searchParams.get("orden") ?? "price_desc";

  function updateParams(next: { categoria?: string; orden?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.categoria !== undefined) {
      if (next.categoria) params.set("categoria", next.categoria);
      else params.delete("categoria");
    }
    if (next.orden !== undefined) {
      params.set("orden", next.orden);
    }
    // Cambiar de filtro siempre vuelve a la página 1 — si no, podrías
    // quedar en una página que ya no existe para la nueva selección.
    params.delete("pagina");

    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        <button
          onClick={() => updateParams({ categoria: "" })}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-heading transition-colors ${
            activeCategory === ""
              ? "border-amber bg-amber/10 text-amber"
              : "border-oud-800 text-parchment-dim hover:border-amber-bright/50"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat.slug];
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => updateParams({ categoria: cat.slug })}
              className="shrink-0 rounded-full border px-3 py-1.5 text-sm font-heading transition-colors"
              style={{
                borderColor: isActive ? meta?.accent : "var(--oud-800)",
                backgroundColor: isActive ? `${meta?.accent}1a` : "transparent",
                color: isActive ? meta?.accent : "var(--parchment-dim)",
              }}
            >
              {meta?.label ?? cat.name}
            </button>
          );
        })}
      </div>

      <label className="flex shrink-0 items-center gap-2 text-sm text-parchment-dim">
        Ordenar
        <select
          value={activeSort}
          onChange={(e) => updateParams({ orden: e.target.value })}
          className="rounded-md border border-oud-800 bg-oud-900 px-2 py-1.5 text-parchment"
        >
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="name_asc">Nombre A-Z</option>
        </select>
      </label>
    </div>
  );
}
