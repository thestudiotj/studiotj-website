import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadItem, loadAllItems, loadActiveCategories } from "@/lib/gear/loader";
import { isValidGearCategory, GEAR_CATEGORY_LABELS } from "@/lib/gear/categories";
import type { Item } from "@/lib/gear/schemas";
import { mdxComponents } from "@/components/mdx";
import ItemHero from "@/components/gear/ItemHero";
import ItemSpecs from "@/components/gear/ItemSpecs";
import ItemGallery from "@/components/gear/ItemGallery";
import ItemRelated from "@/components/gear/ItemRelated";

interface Props {
  params: Promise<{ category: string; item: string }>;
}

export function generateStaticParams() {
  return loadAllItems().map((i) => ({ category: i.category, item: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, item: itemSlug } = await params;
  if (!isValidGearCategory(category)) return {};
  try {
    const item = loadItem(category, itemSlug);
    const displayName = GEAR_CATEGORY_LABELS[category];
    return {
      title: `${item.name} — ${displayName} — My Gear`,
      description: item.hook + " " + item.body.trim().split(/[.!?]/)[0] + ".",
      openGraph: {
        images: [`https://photos.studiotj.com${item.hero_image}`],
      },
    };
  } catch {
    return {};
  }
}

export default async function GearItemPage({ params }: Props) {
  const { category, item: itemSlug } = await params;

  if (!isValidGearCategory(category)) notFound();

  const activeCategories = loadActiveCategories();
  if (!activeCategories.includes(category)) notFound();

  let item: Item;
  try {
    item = loadItem(category, itemSlug);
  } catch {
    notFound();
  }

  const displayName = GEAR_CATEGORY_LABELS[category];
  const allItems = loadAllItems();
  const related = item.related_slugs
    .map((slug) => allItems.find((i) => i.slug === slug))
    .filter((i): i is Item => i !== undefined);

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex flex-wrap items-center gap-2">
        <Link href="/gear" className="hover:text-ink transition-colors">
          My Gear
        </Link>
        <span aria-hidden="true">·</span>
        <Link href={`/gear/${category}`} className="hover:text-ink transition-colors">
          {displayName}
        </Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">{item.name}</span>
      </nav>

      <div className="max-w-5xl">
        <ItemHero
          name={item.name}
          tag={item.tag}
          hook={item.hook}
          heroImage={item.hero_image}
        />

        <div className="prose prose-lg max-w-[640px] mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={item.body} components={mdxComponents} />
        </div>

        <ItemSpecs specs={item.specs} />

        <ItemGallery images={item.supporting_images} itemName={item.name} />

        <ItemRelated items={related} />
      </div>
    </div>
  );
}
