import Link from "next/link";
import { Camera, Aperture, AppWindow, Headphones, HardDrive, type LucideIcon } from "lucide-react";
import type { GearCategory } from "@/lib/gear/categories";

const CATEGORY_ICONS: Partial<Record<GearCategory, LucideIcon>> = {
  cameras: Camera,
  lenses: Aperture,
  software: AppWindow,
  accessories: Headphones,
  "computer-storage": HardDrive,
};

interface CategoryEntry {
  category: string;
  title: string;
  description?: string;
}

interface CategoryGridProps {
  categories: CategoryEntry[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <ul className="divide-y divide-dust/20">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.category as GearCategory] ?? Camera;
        return (
          <li key={cat.category}>
            <Link
              href={`/gear/${cat.category}`}
              className="group flex items-center gap-5 py-5 hover:text-accent transition-colors"
            >
              <Icon
                size={22}
                className="text-muted group-hover:text-accent transition-colors flex-shrink-0"
              />
              <div>
                <p className="font-display text-xl text-ink group-hover:text-accent transition-colors leading-snug">
                  {cat.title}
                </p>
                {cat.description && (
                  <p className="text-sm text-muted mt-0.5 leading-relaxed">{cat.description}</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
