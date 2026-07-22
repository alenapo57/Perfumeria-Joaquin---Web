"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { WhatsappCTA } from "@/components/WhatsappCTA";
import type { ShippingRule } from "@/lib/products";

export function CartView({ shippingRules }: { shippingRules: ShippingRule[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [zone, setZone] = useState<"local" | "nacional">("local");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Evita el flash de "carrito vacío" en el servidor antes de que
  // zustand termine de leer localStorage en el navegador.
  if (!mounted) return null;

  const subtotal = cartSubtotal(items);
  const rule = shippingRules.find((r) => r.zone === zone);
  const shippingCost =
    zone === "local"
      ? 0
      : rule?.freeFromAmount != null && subtotal >= rule.freeFromAmount
        ? 0
        : (rule?.fixedCost ?? 0);
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-heading text-parchment">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="rounded-full border border-oud-800 px-5 py-2 text-sm text-parchment-dim transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const canCheckout = customerName.trim() !== "" && customerPhone.trim() !== "";

  async function handleMercadoPagoCheckout() {
    setCheckoutError(null);
    setIsRedirecting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          zone,
          customerName,
          customerPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.initPoint) {
        setCheckoutError(data.error ?? "No se pudo iniciar el pago.");
        setIsRedirecting(false);
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setCheckoutError("No se pudo conectar con el servidor. Probá de nuevo.");
      setIsRedirecting(false);
    }
  }

  const orderMessage = [
    "Hola! Quiero hacer este pedido:",
    ...items.map(
      (item) =>
        `- ${item.name}${item.ml ? ` (${item.ml}ml)` : ""} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`
    ),
    `Envío: ${zone === "local" ? "Retiro / envío en San Carlos de Bolívar" : "Envío a todo el país"}${shippingCost > 0 ? ` (${formatPrice(shippingCost)})` : " (gratis)"}`,
    `Total: ${formatPrice(total)}`,
  ].join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 rounded-lg border border-oud-800 bg-oud-900 p-3"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-oud-950/40">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-heading text-sm text-parchment">
                {item.name}
              </span>
              {item.ml && (
                <span className="text-xs text-parchment-dim">{item.ml}ml</span>
              )}
              <span className="text-sm text-amber">{formatPrice(item.price)}</span>
            </div>

            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                setQuantity(item.productId, parseInt(e.target.value, 10) || 0)
              }
              aria-label={`Cantidad de ${item.name}`}
              className="w-14 rounded-md border border-oud-800 bg-oud-950 px-2 py-1 text-center text-parchment"
            />

            <button
              onClick={() => removeItem(item.productId)}
              aria-label={`Quitar ${item.name}`}
              className="text-xs text-rose/70 transition-colors hover:text-rose"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-oud-800 bg-oud-900 p-4">
        <span className="font-heading text-sm text-parchment">
          ¿Dónde recibís el pedido?
        </span>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm text-parchment-dim">
            <input
              type="radio"
              name="zone"
              checked={zone === "local"}
              onChange={() => setZone("local")}
            />
            San Carlos de Bolívar
          </label>
          <label className="flex items-center gap-2 text-sm text-parchment-dim">
            <input
              type="radio"
              name="zone"
              checked={zone === "nacional"}
              onChange={() => setZone("nacional")}
            />
            Resto del país
          </label>
        </div>

        <div className="mt-2 flex flex-col gap-1 border-t border-oud-800 pt-3 text-sm">
          <div className="flex justify-between text-parchment-dim">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-parchment-dim">
            <span>Envío</span>
            <span>{shippingCost > 0 ? formatPrice(shippingCost) : "Gratis"}</span>
          </div>
          <div className="flex justify-between font-heading text-base font-bold text-amber">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-oud-800 bg-oud-900 p-4">
        <span className="font-heading text-sm text-parchment">Tus datos</span>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nombre y apellido"
          className="rounded-md border border-oud-800 bg-oud-950 px-3 py-2 text-parchment"
        />
        <input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Teléfono (para coordinar la entrega)"
          className="rounded-md border border-oud-800 bg-oud-950 px-3 py-2 text-parchment"
        />
      </div>

      {checkoutError && (
        <p className="rounded-md bg-rose/10 px-3 py-2 text-sm text-rose">
          {checkoutError}
        </p>
      )}

      <button
        onClick={handleMercadoPagoCheckout}
        disabled={!canCheckout || isRedirecting}
        className="rounded-lg bg-amber px-6 py-3 text-center font-heading font-semibold text-oud-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRedirecting ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
      </button>
      {!canCheckout && (
        <p className="-mt-4 text-center text-xs text-parchment-dim">
          Completá tu nombre y teléfono para poder pagar.
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-parchment-dim">
        <span className="h-px flex-1 bg-oud-800" />
        o si preferís
        <span className="h-px flex-1 bg-oud-800" />
      </div>

      <WhatsappCTA
        message={orderMessage}
        className="rounded-lg border border-oud-800 px-6 py-3 text-center font-heading text-parchment transition-colors hover:border-amber-bright/50 hover:text-amber-bright"
      >
        Coordinar el pedido por WhatsApp
      </WhatsappCTA>
    </div>
  );
}
