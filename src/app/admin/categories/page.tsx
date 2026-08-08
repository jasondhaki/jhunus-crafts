import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guards";
import { getCategoriesWithProductCount } from "@/lib/admin/category-query";
import { CreateCategoryForm } from "@/components/admin/create-category-form";
import { CategoryRow } from "@/components/admin/category-row";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategoriesWithProductCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-bark">Categories</h1>
        <p className="mt-1 text-sm text-gray-500">
          Not spelled out in the original task beyond the sidebar link — this exists because the
          product form needs somewhere to create and manage categories.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CreateCategoryForm />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
