import { resolveR2 } from "@/lib/vondsten/paths";
import AmazonCTA from "./AmazonCTA";

interface ProductHeroProps {
  name: string;
  tag: string;
  hook: string;
  heroImage: string;
  amazonUrl: string;
}

export default function ProductHero({ name, tag, hook, heroImage, amazonUrl }: ProductHeroProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
      {/* Hero image — 4:5 aspect ratio */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveR2(heroImage)}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info column */}
      <div className="pt-0 md:pt-4">
        <p className="text-sm tracking-widest uppercase text-muted mb-3">{tag}</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">{name}</h1>
        <p className="text-lg text-muted leading-relaxed mb-8">{hook}</p>
        <AmazonCTA url={amazonUrl} showDisclosurePrefix={true} />
      </div>
    </div>
  );
}
