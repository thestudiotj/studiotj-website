import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getCategoryIntro, getProducts } from "@/lib/vondsten/loader";
import { CATEGORIES } from "@/lib/vondsten/schemas";
import { CATEGORY_DISPLAY, isValidCategory } from "@/lib/vondsten/categories";
import ProductGrid from "@/components/vondsten/ProductGrid";

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.flatMap((cat) => {
    const products = getProducts(cat);
    if (products.length === 0) return [];
    return [{ category: cat }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isValidCategory(category)) return {};
  const intro = getCategoryIntro(category);
  const displayName = CATEGORY_DISPLAY[category];
  return {
    title: `${displayName} — Vondsten`,
    description: intro.body.trim().slice(0, 150),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  if (!isValidCategory(category)) notFound();

  const products = getProducts(category);
  if (products.length === 0) notFound();

  const intro = getCategoryIntro(category);
  const displayName = CATEGORY_DISPLAY[category];

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex items-center gap-2">
        <Link href="/vondsten" className="hover:text-ink transition-colors">Vondsten</Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">{displayName}</span>
      </nav>

      <h1 className="section-title mb-6">{intro.title}</h1>

      <div className="prose prose-lg max-w-prose mb-12 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
        <MDXRemote source={intro.body} />
      </div>

      <ProductGrid products={products} category={category} />
    </div>
  );
}
