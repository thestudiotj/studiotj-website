import Link from "next/link";
import { resolveR2 } from "@/lib/gear/paths";
import type { Item } from "@/lib/gear/schemas";

interface ItemGridProps {
  items: Item[];
  category: string;
}

export default function ItemGrid({ items, category }: ItemGridProps) {
  const sorted = [...items].sort((a, b) => {
    const statusOrder = { current: 0, wishlist: 1 };
    const diff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    return <p className="text-muted">No items in this category yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sorted.map((item) => (
        <Link
          key={item.slug}
          href={`/gear/${category}/${item.slug}`}
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
          <p className="font-display text-xl text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
            {item.name}
          </p>
          <p className="text-sm text-muted leading-relaxed">{item.hook}</p>
        </Link>
      ))}
    </div>
  );
}
