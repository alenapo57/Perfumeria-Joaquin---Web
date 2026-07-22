const PUBLIC_URL_MARKER = "/object/public/products/";

/**
 * Convierte una URL pública de Supabase Storage
 * (https://xxx.supabase.co/storage/v1/object/public/products/foo.jpg)
 * de vuelta al "path" que usa la API de Storage (foo.jpg), para poder
 * borrarlo. Devuelve null si la URL no pertenece al bucket "products"
 * (por las dudas, para no intentar borrar algo que no reconocemos).
 */
export function extractStoragePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const idx = imageUrl.indexOf(PUBLIC_URL_MARKER);
  if (idx === -1) return null;
  return imageUrl.slice(idx + PUBLIC_URL_MARKER.length);
}
