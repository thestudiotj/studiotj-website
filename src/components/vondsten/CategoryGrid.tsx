import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  ShoppingBag,
  User,
  Blocks,
  Monitor,
  Gamepad2,
  Camera,
  Film,
  Music,
  PenLine,
  Pencil,
  Tv,
  BookMarked,
  Star,
  Bot,
  Shuffle,
  Languages,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIntro } from "@/lib/vondsten/schemas";
import type { CATEGORIES } from "@/lib/vondsten/schemas";

type VondstenCategory = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Record<VondstenCategory, LucideIcon> = {
  lezen: BookOpen,
  "dames-verzorging": Sparkles,
  "amazon-direct": ShoppingBag,
  "heren-verzorging": User,
  lego: Blocks,
  "home-media-hardware": Monitor,
  gaming: Gamepad2,
  fotografie: Camera,
  film: Film,
  muziek: Music,
  schrijven: PenLine,
  tekenen: Pencil,
  anime: Tv,
  manga: BookMarked,
  pokemon: Star,
  gundam: Bot,
  "fidget-toys": Shuffle,
  "taal-leren": Languages,
};

function extractFirstLine(body: string): string {
  return body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)[0] ?? "";
}

interface CategoryGridProps {
  categories: (CategoryIntro & { category: string })[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <ul className="divide-y divide-dust/20">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.category as VondstenCategory] ?? ShoppingBag;
        const description = extractFirstLine(cat.body);
        return (
          <li key={cat.category}>
            <Link
              href={`/vondsten/${cat.category}`}
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
                {description && (
                  <p className="text-sm text-muted mt-0.5 leading-relaxed">{description}</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
