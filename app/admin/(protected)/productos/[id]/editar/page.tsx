import { notFound } from "next/navigation";
import { getCategories, getProductByIdForAdmin } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "../../actions";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductByIdForAdmin(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-lg font-semibold text-parchment">
        Editar producto
      </h1>
      <ProductForm
        action={updateProduct.bind(null, id)}
        categories={categories}
        product={product}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
