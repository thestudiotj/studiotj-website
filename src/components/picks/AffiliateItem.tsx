import { resolveR2 } from "@/lib/picks/paths";

interface AffiliateItemProps {
  brand: string;
  product_name: string;
  affiliate_url: string;
  image?: string;
  image_alt?: string;
  children?: React.ReactNode;
}

export default function AffiliateItem({
  brand,
  product_name,
  affiliate_url,
  image,
  image_alt,
  children,
}: AffiliateItemProps) {
  return (
    <div className="not-prose border-t border-dust/30 pt-8 mb-10">
      <div className="grid md:grid-cols-[180px_1fr] gap-6 items-start">
        {image && (
          <div className="relative overflow-hidden aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveR2(image)}
              alt={image_alt ?? `${brand} ${product_name}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <h3 className="font-display text-xl text-ink leading-tight mb-3">
            {brand} · {product_name}
          </h3>
          <div className="text-base text-muted leading-relaxed mb-5">{children}</div>
          <a
            href={affiliate_url}
            rel="sponsored noopener"
            target="_blank"
            className="btn-affiliate"
          >
            View {product_name} →
          </a>
          <p className="text-xs text-muted mt-3 leading-relaxed">Affiliate link.</p>
        </div>
      </div>
    </div>
  );
}
