import { resolveR2 } from "@/lib/picks/paths";

interface BrandProductHeroProps {
  title: string;
  description: string;
  tag?: string;
  hook?: string;
  heroImage?: string;
  heroAspect?: string;
  heroImageAlt?: string;
  attribution?: string;
}

export default function BrandProductHero({
  title,
  description,
  tag,
  hook,
  heroImage,
  heroAspect,
  heroImageAlt,
  attribution,
}: BrandProductHeroProps) {
  const subtitle = hook ?? description;

  if (!heroImage) {
    return (
      <div className="mb-12 max-w-xl">
        {tag && <p className="text-sm tracking-widest uppercase text-muted mb-3">{tag}</p>}
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">{title}</h1>
        <p className="text-lg text-muted leading-relaxed">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
      <div>
        <div className="relative overflow-hidden" style={{ aspectRatio: heroAspect }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(heroImage)}
            alt={heroImageAlt ?? ""}
            className="w-full h-full object-cover"
          />
        </div>
        {attribution && (
          <p className="text-xs text-muted mt-2 leading-relaxed">{attribution}</p>
        )}
      </div>
      <div className="pt-0 md:pt-4">
        {tag && <p className="text-sm tracking-widest uppercase text-muted mb-3">{tag}</p>}
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">{title}</h1>
        <p className="text-lg text-muted leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
