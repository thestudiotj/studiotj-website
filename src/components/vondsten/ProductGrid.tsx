import Link from "next/link";
import { resolveR2 } from "@/lib/vondsten/paths";
import type { Product } from "@/lib/vondsten/schemas";

interface ProductGridProps {
  products: Product[];
  category: string;
}

export default function ProductGrid({ products, category }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="text-muted">Nog geen producten in deze categorie.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link
          key={product.slug}
          href={`/vondsten/${category}/${product.slug}`}
          className="group block"
        >
          <div className="relative overflow-hidden aspect-square mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveR2(product.hero_image)}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          </div>
          <p className="text-xs tracking-widest uppercase text-muted mb-1">{product.tag}</p>
          <p className="font-display text-xl text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
            {product.name}
          </p>
          <p className="text-sm text-muted leading-relaxed">{product.hook}</p>
        </Link>
      ))}
    </div>
  );
}
