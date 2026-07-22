import crypto from "crypto";
import { Payment } from "mercadopago";
import { getMercadoPagoClient } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPaymentConfirmed } from "@/lib/notifications";

/**
 * Valida el header x-signature siguiendo el formato documentado por
 * Mercado Pago: "ts=...,v1=..." donde v1 es un HMAC-SHA256 del
 * manifest `id:<data.id en minúsculas>;request-id:<x-request-id>;ts:<ts>;`
 * firmado con el webhook secret.
 *
 * Devuelve false ante cualquier problema (firma ausente, mal armada,
 * o que no coincide) — nunca asume válido por defecto.
 */
function isValidSignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!signatureHeader || !requestId) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(v1);
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(request: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Falta MERCADOPAGO_WEBHOOK_SECRET — no se puede validar el webhook.");
    // 200 para que Mercado Pago no reintente indefinidamente un error
    // que no se va a resolver solo; el problema es de configuración,
    // no algo transitorio.
    return new Response(null, { status: 200 });
  }

  const url = new URL(request.url);
  const dataIdFromQuery = url.searchParams.get("data.id");

  let body: { action?: string; data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    // Algunas notificaciones no traen body; no es un error fatal si
    // el data.id vino por query string.
  }

  const dataId = dataIdFromQuery ?? body.data?.id;
  if (!dataId) {
    return new Response(null, { status: 200 });
  }

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!isValidSignature(signatureHeader, requestId, dataId, secret)) {
    console.warn("Webhook de Mercado Pago con firma inválida — ignorado.");
    return new Response(null, { status: 401 });
  }

  // La firma es válida, pero igual NO confiamos en el contenido del
  // body para saber el estado del pago — se lo pedimos directamente
  // a la API de Mercado Pago con el id, que es la única fuente de
  // verdad real.
  let payment;
  try {
    const client = getMercadoPagoClient();
    payment = await new Payment(client).get({ id: dataId });
  } catch (err) {
    console.error("Error consultando el pago en Mercado Pago:", err);
    return new Response(null, { status: 502 });
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    return new Response(null, { status: 200 });
  }

  const supabaseAdmin = createAdminClient();

  // Se trae el pedido ANTES de actualizar, para dos cosas: saber si
  // ya estaba pagado (Mercado Pago reintenta webhooks, no queremos
  // mandar el mail de "pago confirmado" dos veces) y tener los datos
  // (nombre, teléfono, items) que necesita el email.
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("status, customer_name, customer_phone, items, total")
    .eq("id", orderId)
    .maybeSingle();

  if (payment.status === "approved") {
    await supabaseAdmin
      .from("orders")
      .update({ status: "paid", mp_payment_id: String(payment.id) })
      .eq("id", orderId);

    if (existingOrder && existingOrder.status !== "paid") {
      void notifyPaymentConfirmed({
        id: orderId,
        customerName: existingOrder.customer_name,
        customerPhone: existingOrder.customer_phone,
        items: existingOrder.items,
        total: Number(existingOrder.total),
      });
    }
  } else if (payment.status === "rejected" || payment.status === "cancelled") {
    await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", mp_payment_id: String(payment.id) })
      .eq("id", orderId);
  }
  // Cualquier otro estado (pending, in_process, etc.) se deja como
  // "pending" — Mercado Pago va a mandar otra notificación cuando
  // cambie de estado.

  return new Response(null, { status: 200 });
}
