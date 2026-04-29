import Link from "next/link";
import { resolveR2 } from "@/lib/gear/paths";
import type { Item } from "@/lib/gear/schemas";

interface ItemGridProps {
  items: Item[];
  category: string;
}

export default function ItemGrid({ items, category }: ItemGridProps) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

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
          {item.hero_image && (
            <div className="relative overflow-hidden aspect-square mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveR2(item.hero_image)}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
          )}
          <p className="font-display text-xl text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
            {item.name}
          </p>
          <p className="text-sm text-muted leading-relaxed">{item.summary}</p>
        </Link>
      ))}
    </div>
  );
}
