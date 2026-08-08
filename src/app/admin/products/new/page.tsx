import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guards";
import { getAllCategories } from "@/lib/admin/product-query";
import { createProductAction } from "@/actions/admin/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "New Product",
};

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-bark">New Product</h1>
      <ProductForm categories={categories} action={createProductAction} />
    </div>
  );
}
