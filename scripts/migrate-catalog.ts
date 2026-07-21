/**
 * Migra el catálogo real (192 productos relevados de la tienda actual
 * en Tiendanegocio) a la base de Supabase.
 *
 * Uso:
 *   1. Completar .env.local con NEXT_PUBLIC_SUPABASE_URL y
 *      SUPABASE_SERVICE_ROLE_KEY (hace falta la service_role porque
 *      este script escribe directo, bypasseando RLS).
 *   2. Correr el schema.sql en el SQL Editor de Supabase primero.
 *   3. npx tsx scripts/migrate-catalog.ts
 *
 * Importante: el CSV original no trae categoría, marca ni ml —viene
 * de una vista "todos los productos" de la tienda vieja, no de la
 * estructura de categorías real. Este script INFIERE esos datos con
 * heurísticas simples a partir del nombre. Revisá el resultado en el
 * panel de admin después de migrar y corregí lo que haga falta a mano:
 * es un punto de partida, no un mapeo garantizado 100% correcto.
 */
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Categorías base, iguales a las de la tienda actual.
const CATEGORIES = [
  { name: "Árabes Originales", slug: "arabesoriginales" },
  { name: "Réplicas", slug: "replicas" },
  { name: "Yves D'Orgeval", slug: "yvesdorgeval" },
  { name: "Nacionales", slug: "nacionales" },
  { name: "Otros", slug: "otros" },
];

// Marcas conocidas, para detectar por coincidencia en el nombre.
const KNOWN_BRANDS = [
  "Armaf", "Afnan", "Al Haramain", "AH Haramain", "Lattafa", "Bharara",
  "Rasasi", "Xerjoff", "Orientica", "Maison Alhambra", "French Avenue",
  "JPG", "Khamrah", "Bayaan", "Hawas",
];

function inferBrand(name: string): string | null {
  const upper = name.toUpperCase();
  for (const brand of KNOWN_BRANDS) {
    if (upper.includes(brand.toUpperCase())) return brand;
  }
  return null;
}

function inferMl(name: string): number | null {
  const match = name.match(/(\d{2,3})\s*ml/i);
  return match ? parseInt(match[1], 10) : null;
}

function inferCategorySlug(name: string): string {
  const lower = name.toLowerCase();
  const looksLikeReplica =
    lower.includes("alternativo") ||
    lower.includes("generico") ||
    lower.includes(" g5") ||
    lower.includes("g5 ");
  if (looksLikeReplica) return "replicas";

  const looksLikeYvesDorgeval =
    lower.startsWith("yd") || lower.includes("yves d") || lower.includes("l'uomo");
  if (looksLikeYvesDorgeval) return "yvesdorgeval";

  const looksLikeArabOriginal = KNOWN_BRANDS.some((b) =>
    lower.includes(b.toLowerCase())
  );
  if (looksLikeArabOriginal) return "arabesoriginales";

  return "otros";
}

function parsePrice(raw: string): number {
  // "$198.500" -> 198500  (formato ARS: punto como separador de miles)
  return parseInt(raw.replace(/[^\d]/g, ""), 10);
}

function slugify(productoUrl: string): string {
  // "producto/al-haramain-gold-edition-120ml" -> "al-haramain-gold-edition-120ml"
  return productoUrl.replace(/^producto\//, "");
}

async function main() {
  console.log("1) Creando categorías base...");
  const categoryIdBySlug = new Map<string, string>();

  for (const cat of CATEGORIES) {
    const { data, error } = await supabase
      .from("categories")
      .upsert({ name: cat.name, slug: cat.slug }, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (error) throw error;
    categoryIdBySlug.set(data.slug, data.id);
    console.log(`   ✓ ${cat.name}`);
  }

  console.log("2) Leyendo catalogo-perfumeria-joaquin.csv...");
  const csvContent = readFileSync(
    path.resolve(__dirname, "catalogo-perfumeria-joaquin.csv"),
    "utf-8"
  );
  const records: { nombre: string; precio: string; slug: string }[] = parse(
    csvContent,
    { columns: true, skip_empty_lines: true }
  );
  console.log(`   ${records.length} productos encontrados en el CSV`);

  console.log("3) Insertando productos con marca/ml/categoría inferidos...");
  let inserted = 0;
  let skipped = 0;

  for (const row of records) {
    const name = row.nombre.trim();
    const price = parsePrice(row.precio);
    const slug = slugify(row.slug.trim());
    const brand = inferBrand(name);
    const ml = inferMl(name);
    const categorySlug = inferCategorySlug(name);
    const categoryId = categoryIdBySlug.get(categorySlug) ?? null;

    const { error } = await supabase.from("products").upsert(
      {
        name,
        slug,
        price,
        brand,
        ml,
        category_id: categoryId,
        installments_enabled: true, // todos los productos ya usan "hasta 3 cuotas"
        active: true,
        stock: 0, // ⚠️ el CSV no trae stock real: completar a mano o vía panel admin
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`   ✗ Error con "${name}":`, error.message);
      skipped++;
    } else {
      inserted++;
    }
  }

  console.log(`\nListo. ${inserted} productos migrados, ${skipped} con error.`);
  console.log(
    "\n⚠️ Recordatorio: el stock quedó en 0 para todos (el CSV no lo traía)."
  );
  console.log(
    "   Revisá la categorización inferida desde el panel de admin y ajustá lo necesario."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
