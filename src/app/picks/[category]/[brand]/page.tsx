import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadBrand, loadAllBrands, loadActiveCategories, loadBrandProducts } from "@/lib/picks/loader";
import { isValidPicksCategory, PICKS_CATEGORY_LABELS } from "@/lib/picks/categories";
import type { Brand, BrandProduct } from "@/lib/picks/schemas";
import { mdxComponents } from "@/components/mdx";
import { resolveAspect } from "@/lib/picks/imageAspect";
import BrandHero from "@/components/picks/BrandHero";
import BrandMakes from "@/components/picks/BrandMakes";
import BrandGallery from "@/components/picks/BrandGallery";
import BrandRelated from "@/components/picks/BrandRelated";
import AffiliateCTA from "@/components/picks/AffiliateCTA";
import BrandProductCard from "@/components/picks/BrandProductCard";

interface Props {
  params: Promise<{ category: string; brand: string }>;
}

export function generateStaticParams() {
  return loadAllBrands().map((b) => ({ category: b.category, brand: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, brand: brandSlug } = await params;
  if (!isValidPicksCategory(category)) return {};
  try {
    const brand = loadBrand(category, brandSlug);
    const displayName = PICKS_CATEGORY_LABELS[category];
    return {
      title: `${brand.name} — ${displayName} — Picks`,
      description: brand.hook + " " + brand.body.trim().split(/[.!?]/)[0] + ".",
      openGraph: {
        images: [`https://photos.studiotj.com${brand.hero_image.startsWith('/') ? brand.hero_image : `/${brand.hero_image}`}`],
      },
    };
  } catch {
    return {};
  }
}

export default async function BrandPage({ params }: Props) {
  const { category, brand: brandSlug } = await params;

  if (!isValidPicksCategory(category)) notFound();

  const activeCategories = loadActiveCategories();
  if (!activeCategories.includes(category)) notFound();

  let brand: Brand;
  try {
    brand = loadBrand(category, brandSlug);
  } catch {
    notFound();
  }

  const displayName = PICKS_CATEGORY_LABELS[category];
  const allBrands = loadAllBrands();
  const related = brand.related_slugs
    .map((slug) => allBrands.find((b) => b.slug === slug))
    .filter((b): b is Brand => b !== undefined);

  const products = loadBrandProducts(category, brandSlug);

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
        <span className="text-ink">{brand.name}</span>
      </nav>

      <div className="max-w-5xl">
        <BrandHero
          name={brand.name}
          tag={brand.tag}
          hook={brand.hook}
          heroImage={brand.hero_image}
          heroAspect={resolveAspect(brand.hero_image, 'hero', brand.hero_aspect)}
          affiliateUrl={brand.affiliate_url}
        />

        <div className="prose prose-lg max-w-[640px] mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={brand.body} components={mdxComponents} />
        </div>

        <BrandMakes makes={brand.makes} />

        {products.length > 0 && (
          <section className="border-t border-dust/30 pt-10 mb-10">
            <h2 className="font-display text-2xl text-ink mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: BrandProduct) => (
                <BrandProductCard
                  key={product.slug}
                  product={product}
                  href={`/picks/${category}/${brandSlug}/${product.slug}`}
                />
              ))}
            </div>
          </section>
        )}

        <BrandGallery images={brand.supporting_images} brandName={brand.name} />

        {/* CTA repeat */}
        <div className="border-t border-dust/30 pt-8 mb-10">
          <p className="text-lg text-muted leading-relaxed mb-6">{brand.hook}</p>
          <AffiliateCTA url={brand.affiliate_url} brandName={brand.name} />
        </div>

        <BrandRelated brands={related} />
      </div>
    </div>
  );
}
