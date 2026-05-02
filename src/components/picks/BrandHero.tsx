import { resolveR2 } from "@/lib/picks/paths";
import AffiliateCTA from "./AffiliateCTA";

interface BrandHeroProps {
  name: string;
  tag: string;
  hook: string;
  heroImage: string;
  heroAspect: string;
  affiliateUrl: string;
}

export default function BrandHero({ name, tag, hook, heroImage, heroAspect, affiliateUrl }: BrandHeroProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
      <div className="relative overflow-hidden" style={{ aspectRatio: heroAspect }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveR2(heroImage)}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="pt-0 md:pt-4">
        <p className="text-sm tracking-widest uppercase text-muted mb-3">{tag}</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">{name}</h1>
        <p className="text-lg text-muted leading-relaxed mb-8">{hook}</p>
        <AffiliateCTA url={affiliateUrl} brandName={name} />
      </div>
    </div>
  );
}
