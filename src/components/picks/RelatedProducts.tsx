import type { BrandProduct } from "@/lib/picks/schemas";
import BrandProductCard from "./BrandProductCard";

interface RelatedProductsProps {
  products: BrandProduct[];
  category: string;
  brandSlug: string;
}

export default function RelatedProducts({ products, category, brandSlug }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-10 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <BrandProductCard
            key={product.slug}
            product={product}
            href={`/picks/${category}/${brandSlug}/${product.slug}`}
          />
        ))}
      </div>
    </section>
  );
}
