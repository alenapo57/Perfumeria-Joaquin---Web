import "server-only";
import { MercadoPagoConfig } from "mercadopago";

/**
 * Cliente de Mercado Pago. Se crea una instancia nueva por request en
 * vez de una global module-level, para evitar compartir estado entre
 * requests distintos en el runtime serverless de Vercel.
 *
 * "server-only" evita que este archivo se importe por error desde un
 * componente de cliente (el access token es secreto).
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno."
    );
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}
