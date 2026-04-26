import { resolveR2 } from "@/lib/gear/paths";

interface ItemHeroProps {
  name: string;
  tag?: string;
  hook: string;
  heroImage: string;
  status: "current" | "wishlist";
}

export default function ItemHero({ name, tag, hook, heroImage, status }: ItemHeroProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveR2(heroImage)}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="pt-0 md:pt-4">
        {tag && (
          <p className="text-sm tracking-widest uppercase text-muted mb-3">{tag}</p>
        )}
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">{name}</h1>
        <div className="mb-5">
          {status === "current" ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-ink text-[var(--paper)] text-xs tracking-widest uppercase">
              Current
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-dust text-muted text-xs tracking-widest uppercase">
              Wishlist
            </span>
          )}
        </div>
        <p className="text-lg text-muted leading-relaxed">{hook}</p>
      </div>
    </div>
  );
}
