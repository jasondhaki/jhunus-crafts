import { getRelatedProducts } from "@/lib/product-query";
import { ProductCard } from "@/components/shop/product-card";

export async function RelatedProducts({
  categoryId,
  excludeProductId,
}: {
  categoryId: string;
  excludeProductId: string;
}) {
  const related = await getRelatedProducts(categoryId, excludeProductId, 4);

  if (related.length === 0) return null;

  return (
    <section className="py-16">
      <h2 className="font-serif text-3xl text-bark">You May Also Like</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
