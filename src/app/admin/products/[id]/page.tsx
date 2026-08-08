import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guards";
import { getAllCategories, getProductForAdmin } from "@/lib/admin/product-query";
import { updateProductAction } from "@/actions/admin/products";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export async function generateMetadata({
  params,
}: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  return { title: product ? `Edit ${product.title}` : "Product" };
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([getProductForAdmin(id), getAllCategories()]);

  if (!product) {
    notFound();
  }

  const boundAction = updateProductAction.bind(null, product.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-bark">Edit {product.title}</h1>
        <DeleteProductButton productId={product.id} />
      </div>
      <ProductForm categories={categories} initialValues={product} action={boundAction} />
    </div>
  );
}
