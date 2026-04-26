import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadCategoryIntro, loadActiveCategories, loadAllItemsInCategory } from "@/lib/gear/loader";
import { isValidGearCategory, GEAR_CATEGORY_LABELS } from "@/lib/gear/categories";
import ItemGrid from "@/components/gear/ItemGrid";

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return loadActiveCategories().map((cat) => ({ category: cat }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isValidGearCategory(category)) return {};
  const intro = loadCategoryIntro(category);
  const displayName = GEAR_CATEGORY_LABELS[category];
  return {
    title: `${displayName} — My Gear`,
    description: intro
      ? intro.body.trim().slice(0, 150)
      : `${displayName} gear from StudioTJ.`,
  };
}

export default async function GearCategoryPage({ params }: Props) {
  const { category } = await params;

  if (!isValidGearCategory(category)) notFound();

  const activeCategories = loadActiveCategories();
  if (!activeCategories.includes(category)) notFound();

  const intro = loadCategoryIntro(category);
  const items = loadAllItemsInCategory(category);
  const displayName = GEAR_CATEGORY_LABELS[category];

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex items-center gap-2">
        <Link href="/gear" className="hover:text-ink transition-colors">
          My Gear
        </Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">{displayName}</span>
      </nav>

      <h1 className="section-title mb-6">{intro?.title ?? displayName}</h1>

      {intro && (
        <div className="prose prose-lg max-w-prose mb-12 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={intro.body} />
        </div>
      )}

      <ItemGrid items={items} category={category} />
    </div>
  );
}
