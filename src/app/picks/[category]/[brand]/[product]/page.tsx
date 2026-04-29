import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  loadBrand,
  loadBrandProduct,
  loadBrandProducts,
  loadActiveCategories,
  loadAllBrandsInCategory,
  getEffectiveAffiliateUrl,
} from "@/lib/picks/loader";
import { isValidPicksCategory, PICKS_CATEGORY_LABELS } from "@/lib/picks/categories";
import type { Brand, BrandProduct } from "@/lib/picks/schemas";
import { mdxComponents } from "@/components/mdx";
import BrandProductHero from "@/components/picks/BrandProductHero";
import BrandProductSpecs from "@/components/picks/BrandProductSpecs";
import AffiliateCTA from "@/components/picks/AffiliateCTA";

interface Props {
  params: Promise<{ category: string; brand: string; product: string }>;
}

export function generateStaticParams() {
  return loadActiveCategories().flatMap((cat) =>
    loadAllBrandsInCategory(cat).flatMap((brand) =>
      loadBrandProducts(cat, brand.slug).map((product) => ({
        category: cat,
        brand: brand.slug,
        product: product.slug,
      }))
    )
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, brand: brandSlug, product: productSlug } = await params;
  if (!isValidPicksCategory(category)) return {};
  const product = loadBrandProduct(category, brandSlug, productSlug);
  if (!product) return {};
  const displayName = PICKS_CATEGORY_LABELS[category];
  try {
    const brand = loadBrand(category, brandSlug);
    return {
      title: `${product.title} — ${brand.name} — ${displayName} — Picks`,
      description: product.description,
      openGraph: {
        images: [`https://photos.studiotj.com${product.hero_image}`],
      },
    };
  } catch {
    return {
      title: `${product.title} — ${displayName} — Picks`,
      description: product.description,
    };
  }
}

export default async function BrandProductPage({ params }: Props) {
  const { category, brand: brandSlug, product: productSlug } = await params;

  if (!isValidPicksCategory(category)) notFound();

  const activeCategories = loadActiveCategories();
  if (!activeCategories.includes(category)) notFound();

  let brand: Brand;
  try {
    brand = loadBrand(category, brandSlug);
  } catch {
    notFound();
  }

  const product: BrandProduct | null = loadBrandProduct(category, brandSlug, productSlug);
  if (!product) notFound();

  const displayName = PICKS_CATEGORY_LABELS[category];
  const effectiveUrl = getEffectiveAffiliateUrl(product, brand);

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex flex-wrap items-center gap-2">
        <Link href="/picks" className="hover:text-ink transition-colors">
          Picks
        </Link>
        <span aria-hidden="true">·</span>
        <Link href={`/picks/${category}`} className="hover:text-ink transition-colors">
          {displayName}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href={`/picks/${category}/${brandSlug}`} className="hover:text-ink transition-colors">
          {brand.name}
        </Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="max-w-5xl">
        <BrandProductHero
          title={product.title}
          description={product.description}
          heroImage={product.hero_image}
          heroImageAlt={product.hero_image_alt}
          attribution={product.attribution}
        />

        <div className="prose prose-lg max-w-[640px] mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={product.body} components={mdxComponents} />
        </div>

        <BrandProductSpecs specs={product.specs} />

        <div className="border-t border-dust/30 pt-8 mb-10">
          <p className="text-lg text-muted leading-relaxed mb-6">{product.description}</p>
          <AffiliateCTA url={effectiveUrl} label={`View ${product.title}`} />
        </div>
      </div>
    </div>
  );
}
