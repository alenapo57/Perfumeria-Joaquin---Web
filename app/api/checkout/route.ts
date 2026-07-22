import { Preference } from "mercadopago";
import { getMercadoPagoClient } from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewOrder } from "@/lib/notifications";

type CheckoutRequestItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  let body: {
    items?: CheckoutRequestItem[];
    zone?: "local" | "nacional";
    customerName?: string;
    customerPhone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const zone = body.zone === "nacional" ? "nacional" : "local";
  const customerName = String(body.customerName ?? "").trim();
  const customerPhone = String(body.customerPhone ?? "").trim();

  if (items.length === 0) {
    return Response.json({ error: "El carrito está vacío." }, { status: 400 });
  }
  if (!customerName || !customerPhone) {
    return Response.json(
      { error: "Falta el nombre o el teléfono." },
      { status: 400 }
    );
  }

  // El cliente autenticado como "anon" alcanza para leer productos
  // públicos (la policy de RLS ya lo permite), así no hace falta
  // service_role para esta parte.
  const supabase = await createClient();

  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, slug, price, stock, active, image_url")
    .in("id", productIds)
    .eq("active", true);

  if (productsError || !products || products.length === 0) {
    return Response.json(
      { error: "No se pudieron validar los productos del carrito." },
      { status: 400 }
    );
  }

  // ⚠️ REGLA DE SEGURIDAD: el precio y el nombre SIEMPRE salen de lo
  // que acabamos de leer de la base, nunca de lo que mandó el cliente
  // en el body. Si un producto pedido no existe/está inactivo, se
  // ignora (en vez de confiar en cualquier dato que venga de afuera).
  const orderItems = items
    .map((requested) => {
      const product = products.find((p) => p.id === requested.productId);
      if (!product) return null;
      const quantity = Math.max(1, Math.min(10, Math.floor(requested.quantity)));
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderItems.length === 0) {
    return Response.json(
      { error: "Ninguno de los productos del carrito está disponible." },
      { status: 400 }
    );
  }

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const { data: shippingRules } = await supabase
    .from("shipping_rules")
    .select("zone, free_from_amount, fixed_cost");

  const rule = shippingRules?.find((r) => r.zone === zone);
  const shippingCost =
    zone === "local"
      ? 0
      : rule?.free_from_amount != null && subtotal >= Number(rule.free_from_amount)
        ? 0
        : Number(rule?.fixed_cost ?? 0);

  const total = subtotal + shippingCost;

  // Se usa el cliente con service_role para escribir el pedido: todavía
  // no hay un usuario logueado en este punto (es un comprador anónimo),
  // y la tabla `orders` no tiene ninguna policy de escritura para
  // "anon" a propósito — el único camino para crear un pedido es acá,
  // en el servidor, después de recalcular el total nosotros mismos.
  const supabaseAdmin = createAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      items: orderItems,
      total,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return Response.json(
      { error: "No se pudo crear el pedido." },
      { status: 500 }
    );
  }

  // No se espera (await) esto de forma bloqueante para la respuesta:
  // si Resend tarda o falla, el checkout no debería demorarse ni
  // romperse por eso. notifyNewOrder ya atrapa sus propios errores.
  void notifyNewOrder({
    id: order.id,
    customerName,
    customerPhone,
    items: orderItems,
    total,
  });

  const origin = new URL(request.url).origin;

  const preferenceItems = orderItems.map((item) => ({
    id: item.productId,
    title: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    currency_id: "ARS" as const,
  }));

  if (shippingCost > 0) {
    preferenceItems.push({
      id: "envio",
      title: "Envío",
      quantity: 1,
      unit_price: shippingCost,
      currency_id: "ARS",
    });
  }

  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    // auto_return hace que MP redirija solo, sin que el comprador
    // tenga que tocar un botón — pero Mercado Pago RECHAZA ese campo
    // si la URL de vuelta es localhost (no la reconoce como un
    // dominio público válido). En local se omite sin problema: el
    // checkout sigue funcionando igual, el comprador solo tiene que
    // tocar "Volver al sitio" en vez de que sea automático.
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

    const result = await preference.create({
      body: {
        items: preferenceItems,
        external_reference: order.id,
        back_urls: {
          success: `${origin}/pago/exito?order=${order.id}`,
          pending: `${origin}/pago/pendiente?order=${order.id}`,
          failure: `${origin}/pago/error?order=${order.id}`,
        },
        ...(isLocalhost ? {} : { auto_return: "approved" as const }),
        notification_url: `${origin}/api/mercadopago/webhook`,
        payment_methods: {
          // "Hasta 3 cuotas sin interés": esto habilita hasta 3 cuotas
          // en el checkout. Que además sean SIN INTERÉS depende de que
          // la cuenta de Mercado Pago esté sumada a una promoción
          // bancaria o al programa de cuotas sin interés de MP — es
          // algo a confirmar/activar desde el dashboard antes de
          // lanzar a producción, no es automático por poner este valor.
          installments: 3,
        },
      },
    });

    const initPoint =
      process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST-")
        ? result.sandbox_init_point
        : result.init_point;

    await supabaseAdmin
      .from("orders")
      .update({ mp_preference_id: result.id })
      .eq("id", order.id);

    return Response.json({ initPoint });
  } catch (err) {
    console.error("Error creando preferencia de Mercado Pago:", err);
    return Response.json(
      { error: "No se pudo iniciar el pago. Probá de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
