import Link from "next/link";
import { resolveR2 } from "@/lib/picks/paths";
import type { BrandProduct } from "@/lib/picks/schemas";

interface BrandProductCardProps {
  product: BrandProduct;
  href: string;
}

function heroToThumb(heroImage: string): string {
  if (heroImage.endsWith('/hero.webp')) {
    return heroImage.replace('/hero.webp', '/thumb.webp');
  }
  return heroImage;
}

export default function BrandProductCard({ product, href }: BrandProductCardProps) {
  return (
    <Link href={href} className="group block">
      <div
        className="relative overflow-hidden mb-3"
        style={{ aspectRatio: "4 / 5", background: "var(--accent-soft)" }}
      >
        {product.hero_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveR2(heroToThumb(product.hero_image))}
            alt={product.hero_image_alt ?? ""}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500"
          />
        )}
      </div>
      <p className="font-display text-lg text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
        {product.title}
      </p>
      <p className="text-sm text-muted leading-relaxed">{product.hook ?? product.description}</p>
    </Link>
  );
}
