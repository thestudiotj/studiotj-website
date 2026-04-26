import Link from "next/link";
import { resolveR2 } from "@/lib/picks/paths";
import type { Brand } from "@/lib/picks/schemas";

interface BrandGridProps {
  brands: Brand[];
  category: string;
}

export default function BrandGrid({ brands, category }: BrandGridProps) {
  if (brands.length === 0) {
    return <p className="text-muted">No brands in this category yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <Link
          key={brand.slug}
          href={`/picks/${category}/${brand.slug}`}
          className="group block"
        >
          <div className="relative overflow-hidden aspect-square mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveR2(brand.hero_image)}
              alt={brand.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          </div>
          <p className="text-xs tracking-widest uppercase text-muted mb-1">{brand.tag}</p>
          <p className="font-display text-xl text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
            {brand.name}
          </p>
          <p className="text-sm text-muted leading-relaxed">{brand.hook}</p>
        </Link>
      ))}
    </div>
  );
}
