import { getCategories } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "../actions";

export default async function NuevoProductoPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-lg font-semibold text-parchment">
        Nuevo producto
      </h1>
      <ProductForm
        action={createProduct}
        categories={categories}
        submitLabel="Crear producto"
      />
    </div>
  );
}
