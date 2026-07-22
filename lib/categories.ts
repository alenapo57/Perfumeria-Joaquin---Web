/**
 * Cada categoría tiene un color de acento propio — funciona como un
 * sistema de "etiquetas por familia" (parecido a como una perfumería
 * física agrupa árabes/réplicas/nacionales con distinta señalética).
 * Se usa en el borde lateral de las cards y en los chips de filtro.
 */
export const CATEGORY_META: Record<
  string,
  { label: string; accent: string }
> = {
  arabesoriginales: { label: "Árabes Originales", accent: "#c99544" }, // ámbar
  replicas: { label: "Réplicas", accent: "#b97d82" }, // rosa-oud
  yvesdorgeval: { label: "Yves D'Orgeval", accent: "#8b6b9a" }, // ciruela
  nacionales: { label: "Nacionales", accent: "#6e8b7a" }, // salvia
  otros: { label: "Otros", accent: "#a8927f" }, // parchment-dim
};

export const DEFAULT_CATEGORY_ACCENT = "#a8927f";

export function getCategoryAccent(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_CATEGORY_ACCENT;
  return CATEGORY_META[slug]?.accent ?? DEFAULT_CATEGORY_ACCENT;
}
