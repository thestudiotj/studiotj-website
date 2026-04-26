import Link from "next/link";
import { resolveR2 } from "@/lib/picks/paths";
import type { Brand } from "@/lib/picks/schemas";

interface BrandRelatedProps {
  brands: Brand[];
}

export default function BrandRelated({ brands }: BrandRelatedProps) {
  if (brands.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">Related</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/picks/${brand.category}/${brand.slug}`}
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
            <p className="font-display text-lg text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
              {brand.name}
            </p>
            <p className="text-sm text-muted leading-relaxed">{brand.hook}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
