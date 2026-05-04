import Link from "next/link";
import { resolveR2 } from "@/lib/picks/paths";
import { resolveAspect } from "@/lib/picks/imageAspect";
import type { BrandProduct } from "@/lib/picks/schemas";

interface BrandProductCardProps {
  product: BrandProduct;
  href: string;
}

export default function BrandProductCard({ product, href }: BrandProductCardProps) {
  const aspectRatio = product.hero_image
    ? resolveAspect(product.hero_image, 'hero', product.hero_aspect)
    : '4 / 5';

  return (
    <Link href={href} className="group block">
      <div
        className="relative overflow-hidden mb-3"
        style={{ aspectRatio }}
      >
        {product.hero_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveR2(product.hero_image)}
            alt={product.hero_image_alt ?? ""}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
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
