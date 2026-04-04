import { Product, Tenant } from "@/types/supabase";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  onClick,
  tenant
}: {
  products: Product[];
  onClick: (product: Product) => void;
  tenant: Tenant
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} tenant={tenant} handleProductClick={onClick} />
      ))}
    </div>
  );
}
