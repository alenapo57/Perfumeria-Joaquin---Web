import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META } from "@/lib/categories";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  brand: string | null;
  ml: number | null;
  installments_enabled: boolean;
  image_url: string | null;
  category_id: string | null;
  category_slug: string | null;
};

export type SortOption = "price_desc" | "price_asc" | "name_asc";

export const PAGE_SIZE = 24;

const CATEGORY_ORDER = Object.keys(CATEGORY_META);

/**
 * Trae las categorías activas, ordenadas según el orden "de vidriera"
 * que ya usa la tienda actual (Árabes primero, Otros al final), no
 * alfabético.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (error) {
    console.error("Error trayendo categorías:", error.message);
    return [];
  }

  return (data ?? []).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug)
  );
}

/**
 * Trae productos activos, con filtro opcional por categoría, orden y
 * paginado. Se resuelve el slug de categoría a un id primero (dos
 * queries simples) en vez de un filtro embebido, para que quede fácil
 * de leer y de debuggear si algo no trae lo esperado.
 *
 * El paginado usa `.range()` de Supabase, que traduce a un LIMIT/OFFSET
 * en Postgres — así nunca se traen los 192 productos de una sola vez.
 */
export async function getProducts(options?: {
  categorySlug?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}): Promise<{ products: Product[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? PAGE_SIZE;

  let categoryId: string | null = null;
  if (options?.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .maybeSingle();
    categoryId = category?.id ?? null;
    // Si pidieron una categoría que no existe, no devolvemos nada
    // (en vez de accidentalmente devolver todo el catálogo).
    if (!categoryId) return { products: [], total: 0 };
  }

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, description, price, stock, brand, ml, installments_enabled, image_url, category_id, categories(slug)",
      { count: "exact" }
    )
    .eq("active", true);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  switch (options?.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "price_desc":
    default:
      query = query.order("price", { ascending: false });
      break;
  }

  // .order() no garantiza un desempate estable si hay precios repetidos
  // (y hay varios en el catálogo real). Se suma "id" como segundo
  // criterio para que el orden de página a página sea siempre el mismo.
  query = query.order("id", { ascending: true });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error trayendo productos:", error.message);
    return { products: [], total: 0 };
  }

  const products = (data ?? []).map((row) => {
    // categories puede venir como objeto o array según la versión
    // del cliente; se contempla cualquiera de los dos casos.
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: Number(row.price),
      stock: row.stock,
      brand: row.brand,
      ml: row.ml,
      installments_enabled: row.installments_enabled,
      image_url: row.image_url,
      category_id: row.category_id,
      category_slug: cat?.slug ?? null,
    };
  });

  return { products, total: count ?? products.length };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, stock, brand, ml, installments_enabled, image_url, category_id, categories(slug)"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error trayendo producto:", error.message);
    return null;
  }

  const cat = Array.isArray(data.categories) ? data.categories[0] : data.categories;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: Number(data.price),
    stock: data.stock,
    brand: data.brand,
    ml: data.ml,
    installments_enabled: data.installments_enabled,
    image_url: data.image_url,
    category_id: data.category_id,
    category_slug: cat?.slug ?? null,
  };
}

/** Monto a partir del cual el envío nacional es gratis (hoy $100.000). */
export async function getFreeShippingThreshold(): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipping_rules")
    .select("free_from_amount")
    .eq("zone", "nacional")
    .maybeSingle();

  return data?.free_from_amount != null ? Number(data.free_from_amount) : null;
}

export type ShippingRule = {
  zone: "local" | "nacional";
  freeFromAmount: number | null;
  fixedCost: number;
};

/** Trae las dos reglas de envío (local y nacional) para el carrito. */
export async function getShippingRules(): Promise<ShippingRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_rules")
    .select("zone, free_from_amount, fixed_cost");

  if (error) {
    console.error("Error trayendo reglas de envío:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    zone: row.zone,
    freeFromAmount: row.free_from_amount != null ? Number(row.free_from_amount) : null,
    fixedCost: Number(row.fixed_cost),
  }));
}

// =========================================================
// Funciones para el panel de admin: a diferencia de getProducts()
// y getProductBySlug(), estas NO filtran por active=true — el admin
// tiene que poder ver y reactivar productos ocultos. Siguen usando
// el cliente con sesión (no service_role): la policy "products:
// admin ve todo" es la que habilita esto, solo si is_admin() da true.
// =========================================================

export async function getAllProductsForAdmin(options?: {
  page?: number;
  pageSize?: number;
}): Promise<{ products: (Product & { active: boolean })[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, stock, brand, ml, installments_enabled, image_url, category_id, active, categories(slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error trayendo productos (admin):", error.message);
    return { products: [], total: 0 };
  }

  const products = (data ?? []).map((row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: Number(row.price),
      stock: row.stock,
      brand: row.brand,
      ml: row.ml,
      installments_enabled: row.installments_enabled,
      image_url: row.image_url,
      category_id: row.category_id,
      category_slug: cat?.slug ?? null,
      active: row.active,
    } as Product & { active: boolean };
  });

  return { products, total: count ?? products.length };
}

export async function getProductByIdForAdmin(
  id: string
): Promise<(Product & { active: boolean }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, stock, brand, ml, installments_enabled, image_url, category_id, active, categories(slug)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error trayendo producto (admin):", error.message);
    return null;
  }

  const cat = Array.isArray(data.categories) ? data.categories[0] : data.categories;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: Number(data.price),
    stock: data.stock,
    brand: data.brand,
    ml: data.ml,
    installments_enabled: data.installments_enabled,
    image_url: data.image_url,
    category_id: data.category_id,
    category_slug: cat?.slug ?? null,
    active: data.active,
  };
}
