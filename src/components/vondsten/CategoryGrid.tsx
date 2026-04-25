import Link from "next/link";
import { resolveR2 } from "@/lib/vondsten/paths";
import type { CategoryIntro } from "@/lib/vondsten/schemas";

interface CategoryGridProps {
  categories: (CategoryIntro & { category: string })[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.category}
            href={`/vondsten/${cat.category}`}
            className="group block"
          >
            <div className="relative overflow-hidden aspect-video mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveR2(cat.hero_image)}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
            <p className="font-display text-xl text-ink group-hover:text-accent transition-colors">
              {cat.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
