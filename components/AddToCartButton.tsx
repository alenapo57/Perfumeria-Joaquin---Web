"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";

type Props = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  ml: number | null;
  imageUrl: string | null;
  stock: number;
};

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  ml,
  imageUrl,
  stock,
}: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (stock <= 0) {
    return (
      <div className="flex-1 rounded-lg bg-oud-900 px-6 py-3 text-center font-heading text-parchment-dim">
        Sin stock por el momento
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-3">
      <select
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        aria-label="Cantidad"
        className="rounded-lg border border-oud-800 bg-oud-900 px-2 py-3 text-parchment"
      >
        {Array.from({ length: Math.min(stock, 10) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <button
        onClick={() => {
          addItem(
            { productId, slug, name, price, ml, imageUrl },
            quantity
          );
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1500);
        }}
        className="flex-1 rounded-lg bg-amber px-6 py-3 text-center font-heading font-semibold text-oud-950 transition-opacity hover:opacity-90"
      >
        {justAdded ? "¡Agregado! ✓" : "Agregar al carrito"}
      </button>
    </div>
  );
}
