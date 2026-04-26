import Link from "next/link";
import { resolveR2 } from "@/lib/gear/paths";
import type { Item } from "@/lib/gear/schemas";

interface ItemRelatedProps {
  items: Item[];
}

export default function ItemRelated({ items }: ItemRelatedProps) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">Related</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/gear/${item.category}/${item.slug}`}
            className="group block"
          >
            <div className="relative overflow-hidden aspect-square mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveR2(item.hero_image)}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
            <div className="mb-2">
              {item.status === "current" ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ink text-[var(--paper)] text-xs tracking-widest uppercase">
                  Current
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-dust text-muted text-xs tracking-widest uppercase">
                  Wishlist
                </span>
              )}
            </div>
            <p className="font-display text-lg text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
              {item.name}
            </p>
            <p className="text-sm text-muted leading-relaxed">{item.hook}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
