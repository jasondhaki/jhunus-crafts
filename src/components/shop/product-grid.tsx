import { getShopProducts } from "@/lib/shop-query";
import type { ShopSearchParams } from "@/lib/shop-search-params";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/shop/empty-state";
import { ShopPagination } from "@/components/shop/shop-pagination";

export async function ProductGrid({ params }: { params: ShopSearchParams }) {
  const { products, pageCount } = await getShopProducts(params);

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <ShopPagination params={params} pageCount={pageCount} />
    </div>
  );
}
