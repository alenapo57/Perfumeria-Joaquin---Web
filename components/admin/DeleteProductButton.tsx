"use client";

import { deleteProductAction } from "@/app/admin/(protected)/productos/actions";

export function DeleteProductButton({
  id,
  productName,
}: {
  id: string;
  productName: string;
}) {
  return (
    <button
      onClick={() => {
        if (
          confirm(
            `¿Eliminar "${productName}" definitivamente? Esta acción no se puede deshacer — si solo querés ocultarlo del catálogo, usá "Ocultar" en su lugar.`
          )
        ) {
          deleteProductAction(id);
        }
      }}
      className="text-xs text-rose/70 transition-colors hover:text-rose"
    >
      Eliminar
    </button>
  );
}
