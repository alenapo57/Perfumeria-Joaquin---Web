"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth";
import { extractStoragePath } from "@/lib/storage";

export type ProductFormState = { error: string } | null;

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseProductFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "0").trim();
  const mlRaw = String(formData.get("ml") ?? "").trim();

  return {
    name,
    slug: slugInput ? slugify(slugInput) : slugify(name),
    description: String(formData.get("description") ?? "").trim() || null,
    price: Number(priceRaw.replace(",", ".")),
    stock: parseInt(stockRaw, 10) || 0,
    brand: String(formData.get("brand") ?? "").trim() || null,
    ml: mlRaw ? parseInt(mlRaw, 10) : null,
    category_id: String(formData.get("category_id") ?? "") || null,
    installments_enabled: formData.get("installments_enabled") === "on",
    active: formData.get("active") === "on",
  };
}

/**
 * Sube la imagen al bucket "products" si vino un archivo nuevo.
 * Devuelve la URL pública, o null si no se adjuntó ninguna imagen
 * (en cuyo caso el caller mantiene la imagen que ya tenía, si había).
 */
async function uploadImageIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${slug}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado." };

  const supabase = await createClient();
  const fields = parseProductFields(formData);

  if (!fields.name) return { error: "El nombre es obligatorio." };
  if (!fields.price || fields.price <= 0)
    return { error: "El precio tiene que ser mayor a cero." };

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadImageIfPresent(supabase, fields.slug, formData);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const { error } = await supabase.from("products").insert({
    ...fields,
    image_url: imageUrl,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un producto con ese slug. Probá con otro." };
    }
    return { error: `Error al crear el producto: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado." };

  const supabase = await createClient();
  const fields = parseProductFields(formData);

  if (!fields.name) return { error: "El nombre es obligatorio." };
  if (!fields.price || fields.price <= 0)
    return { error: "El precio tiene que ser mayor a cero." };

  // Guardamos la imagen anterior ANTES de subir la nueva, para poder
  // borrarla de Storage si la reemplazamos (si no, queda huérfana:
  // ocupa espacio y nunca se vuelve a usar).
  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  const previousImageUrl = existing?.image_url ?? null;

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadImageIfPresent(supabase, fields.slug, formData);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const updateData: Record<string, unknown> = { ...fields };
  if (imageUrl) updateData.image_url = imageUrl;

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe un producto con ese slug. Probá con otro." };
    }
    return { error: `Error al guardar: ${error.message}` };
  }

  // Recién ahora que el update fue exitoso, borramos la imagen vieja
  // (si había una nueva y era distinta de la anterior).
  if (imageUrl && previousImageUrl && previousImageUrl !== imageUrl) {
    const oldPath = extractStoragePath(previousImageUrl);
    if (oldPath) {
      await supabase.storage.from("products").remove([oldPath]);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/producto/${fields.slug}`);
  redirect("/admin");
}

export async function toggleActiveAction(id: string, nextActive: boolean) {
  const session = await getAdminSession();
  if (!session) return;

  const supabase = await createClient();
  await supabase.from("products").update({ active: nextActive }).eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProductAction(id: string) {
  const session = await getAdminSession();
  if (!session) return;

  const supabase = await createClient();

  // Primero traemos el image_url para poder borrar el archivo de
  // Storage; una vez borrada la fila, ya no tendríamos cómo saber
  // qué archivo le correspondía.
  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("products").delete().eq("id", id);

  const path = extractStoragePath(existing?.image_url);
  if (path) {
    await supabase.storage.from("products").remove([path]);
  }

  revalidatePath("/admin");
  revalidatePath("/");
}
