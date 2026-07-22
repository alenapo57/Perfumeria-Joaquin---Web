"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore, cartItemCount } from "@/lib/cart-store";

export function CartIcon() {
  // El store persiste en localStorage, que no existe en el servidor.
  // Para evitar un mismatch de hidratación (SSR siempre ve 0 items),
  // no mostramos el contador hasta que el componente ya montó en
  // el navegador y zustand terminó de leer el localStorage real.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = useCartStore((state) => cartItemCount(state.items));

  return (
    <Link
      href="/carrito"
      className="relative rounded-full border border-oud-800 p-2 text-parchment-dim transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
      aria-label="Ver carrito"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 8H6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      {mounted && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-oud-950">
          {count}
        </span>
      )}
    </Link>
  );
}
