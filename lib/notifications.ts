import "server-only";
import { Resend } from "resend";
import { formatPrice } from "@/lib/format";

type OrderItem = { name: string; price: number; quantity: number };

/**
 * Manda un email al admin avisando que entró un pedido nuevo.
 * Se llama desde /api/checkout justo después de crear el pedido en
 * la base — así el admin se entera incluso de pedidos que después no
 * se terminan de pagar (útil para hacer seguimiento).
 *
 * Nunca tira una excepción hacia arriba: si Resend falla, se loguea
 * el error pero el checkout continúa. Un email que no salió no
 * debería frenar la venta.
 */
export async function notifyNewOrder(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "RESEND_API_KEY o ADMIN_NOTIFICATION_EMAIL no configurados — no se envía notificación de pedido."
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);

    const itemsHtml = order.items
      .map(
        (item) =>
          `<li>${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}</li>`
      )
      .join("");

    await resend.emails.send({
      // Mientras el dominio no esté verificado en Resend, hay que
      // usar este remitente de prueba — más info en la Fase 6.
      from: "Perfumería Joaquín <onboarding@resend.dev>",
      to,
      subject: `Nuevo pedido — ${formatPrice(order.total)}`,
      html: `
        <h2>Nuevo pedido de ${order.customerName}</h2>
        <p>Teléfono: ${order.customerPhone}</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Total: ${formatPrice(order.total)}</strong></p>
        <p style="color:#888;font-size:12px">Pedido #${order.id.slice(0, 8)} — todavía pendiente de confirmación de pago.</p>
      `,
    });
  } catch (err) {
    console.error("Error enviando email de notificación de pedido:", err);
  }
}

/**
 * Manda un email al admin avisando que un pedido YA SE CONFIRMÓ como
 * pagado (llamado desde el webhook, nunca desde el checkout). El
 * asunto y el mensaje son distintos a propósito del de "nuevo
 * pedido" — este es el que le dice al admin "andá preparando esto".
 */
export async function notifyPaymentConfirmed(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "RESEND_API_KEY o ADMIN_NOTIFICATION_EMAIL no configurados — no se envía notificación de pago confirmado."
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);

    const itemsHtml = order.items
      .map(
        (item) =>
          `<li>${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}</li>`
      )
      .join("");

    await resend.emails.send({
      from: "Perfumería Joaquín <onboarding@resend.dev>",
      to,
      subject: `✅ Pago confirmado — ${formatPrice(order.total)}`,
      html: `
        <h2>¡Pago confirmado! Pedido de ${order.customerName}</h2>
        <p>Teléfono: ${order.customerPhone}</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Total: ${formatPrice(order.total)}</strong></p>
        <p style="color:#2a9d5c;font-weight:bold">Mercado Pago confirmó el pago — ya podés preparar este pedido.</p>
        <p style="color:#888;font-size:12px">Pedido #${order.id.slice(0, 8)}</p>
      `,
    });
  } catch (err) {
    console.error("Error enviando email de pago confirmado:", err);
  }
}
