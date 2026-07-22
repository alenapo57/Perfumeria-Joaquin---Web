"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { CATEGORY_META } from "@/lib/categories";
import type { Category, Product } from "@/lib/products";
import type { ProductFormState } from "@/app/admin/(protected)/productos/actions";

type Props = {
  action: (
    prevState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  categories: Category[];
  product?: Product & { active: boolean };
  submitLabel: string;
};

export function ProductForm({ action, categories, product, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState(product?.slug ?? "");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (slugTouched || product) return; // no pisar un slug ya elegido al editar
    const generated = e.target.value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Nombre *
          <input
            name="name"
            required
            defaultValue={product?.name}
            onChange={handleNameChange}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Slug (URL) *
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Precio (ARS) *
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.price}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Marca
          <input
            name="brand"
            defaultValue={product?.brand ?? ""}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Volumen (ml)
          <input
            name="ml"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.ml ?? ""}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim sm:col-span-2">
          Categoría
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {CATEGORY_META[cat.slug]?.label ?? cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim sm:col-span-2">
          Descripción
          <textarea
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Imagen
          {product?.image_url && (
            <Image
              src={product.image_url}
              alt="Imagen actual"
              width={64}
              height={64}
              className="mb-1 rounded object-cover"
            />
          )}
          <input
            name="image"
            type="file"
            accept="image/*"
            className="rounded-md border border-oud-800 bg-oud-900 px-3 py-2 text-parchment file:mr-3 file:rounded file:border-0 file:bg-oud-800 file:px-2 file:py-1 file:text-parchment"
          />
          {product?.image_url && (
            <span className="text-xs text-parchment-dim">
              Esta es la imagen actual. Elegí un archivo solo si querés reemplazarla.
            </span>
          )}
        </label>

        <div className="flex flex-col justify-center gap-2">
          <label className="flex items-center gap-2 text-sm text-parchment-dim">
            <input
              type="checkbox"
              name="installments_enabled"
              defaultChecked={product?.installments_enabled ?? true}
            />
            Hasta 3 cuotas sin interés
          </label>
          <label className="flex items-center gap-2 text-sm text-parchment-dim">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? true}
            />
            Visible en el catálogo
          </label>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-rose/10 px-3 py-2 text-sm text-rose">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-lg bg-amber px-6 py-2 font-heading font-semibold text-oud-950 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
