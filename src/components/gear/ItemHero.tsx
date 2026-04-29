import { resolveR2 } from "@/lib/gear/paths";

interface ItemHeroProps {
  name: string;
  tag?: string;
  summary: string;
  heroImage?: string;
}

export default function ItemHero({ name, tag, summary, heroImage }: ItemHeroProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
      {heroImage && (
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(heroImage)}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={`pt-0 md:pt-4 ${!heroImage ? "md:col-span-2 max-w-prose" : ""}`}>
        {tag && (
          <p className="text-sm tracking-widest uppercase text-muted mb-3">{tag}</p>
        )}
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">{name}</h1>
        <p className="text-lg text-muted leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
