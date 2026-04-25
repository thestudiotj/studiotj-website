import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getProduct, getAllProducts, getRelatedProducts } from "@/lib/vondsten/loader";
import { CATEGORIES } from "@/lib/vondsten/schemas";
import { CATEGORY_DISPLAY, isValidCategory } from "@/lib/vondsten/categories";
import { buildProductJsonLd } from "@/lib/vondsten/jsonld";
import { mdxComponents } from "@/components/mdx";
import ProductHero from "@/components/vondsten/ProductHero";
import ProductSpecs from "@/components/vondsten/ProductSpecs";
import ProductGallery from "@/components/vondsten/ProductGallery";
import ProductRelated from "@/components/vondsten/ProductRelated";
import AmazonCTA from "@/components/vondsten/AmazonCTA";

interface Props {
  params: Promise<{ category: string; product: string }>;
}

export function generateStaticParams() {
  return getAllProducts().map((p) => ({
    category: p.category,
    product: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, product: slug } = await params;
  if (!isValidCategory(category)) return {};
  const product = getProduct(category, slug);
  if (!product) return {};
  const displayName = CATEGORY_DISPLAY[category];
  return {
    title: `${product.name} — ${displayName} — Vondsten`,
    description: product.hook + " " + product.body.trim().split(/[.!?]/)[0] + ".",
    openGraph: {
      images: [`https://photos.studiotj.com${product.hero_image}`],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { category, product: slug } = await params;

  if (!isValidCategory(category)) notFound();

  const product = getProduct(category, slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);
  const displayName = CATEGORY_DISPLAY[category];
  const jsonLd = buildProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="pt-24 px-6 md:px-12 pb-20">
        {/* Breadcrumb */}
        <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex flex-wrap items-center gap-2">
          <Link href="/vondsten" className="hover:text-ink transition-colors">Vondsten</Link>
          <span aria-hidden="true">·</span>
          <Link href={`/vondsten/${category}`} className="hover:text-ink transition-colors">
            {displayName}
          </Link>
          <span aria-hidden="true">·</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="max-w-5xl">
          <ProductHero
            name={product.name}
            tag={product.tag}
            hook={product.hook}
            heroImage={product.hero_image}
            amazonUrl={product.amazon_url}
          />

          {/* Editorial body */}
          <div className="prose prose-lg max-w-[640px] mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={product.body} components={mdxComponents} />
          </div>

          <ProductSpecs specs={product.specs} />

          <ProductGallery images={product.supporting_images} productName={product.name} />

          {/* CTA repeat */}
          <div className="border-t border-dust/30 pt-8 mb-10">
            <p className="text-lg text-muted leading-relaxed mb-6">{product.hook}</p>
            <div className="flex flex-col gap-3">
              <AmazonCTA url={product.amazon_url} showDisclosurePrefix={false} />
              <p className="text-xs text-muted">Betaalde link.</p>
            </div>
          </div>

          <ProductRelated products={related} />
        </div>
      </div>
    </>
  );
}
