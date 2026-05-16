import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLanding, getActiveActies, getProducts, getCategoryIntro } from "@/lib/vondsten/loader";
import { CATEGORIES } from "@/lib/vondsten/schemas";
import { resolveR2 } from "@/lib/vondsten/paths";
import ActiesBlock from "@/components/vondsten/ActiesBlock";
import CategoryGrid from "@/components/vondsten/CategoryGrid";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const landing = getLanding();
  return {
    title: "Vondsten — Onderzochte productselecties",
    description: landing.description,
    openGraph: {
      locale: "nl_NL",
    },
  };
}

export default async function VondstenPage() {
  const landing = getLanding();
  const activeActies = getActiveActies();

  // Collect categories that have at least one shipped product
  const shippedCategories = CATEGORIES.flatMap((cat) => {
    const products = getProducts(cat);
    if (products.length === 0) return [];
    const intro = getCategoryIntro(cat);
    return [{ ...intro, category: cat }];
  });

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      <div className="flex items-baseline gap-3 mb-4">
        <h1 className="section-title">{landing.title}</h1>
        <span lang="en" className="text-xs text-muted tracking-widest uppercase" aria-label="Dutch-language section">
          NL
        </span>
      </div>

      {landing.description && (
        <p className="text-muted text-lg leading-relaxed mb-6 max-w-prose">
          {landing.description}
        </p>
      )}

      <p lang="en" className="text-xs text-muted tracking-wide mb-10 max-w-prose">
        Vondsten runs in Dutch because the products go through amazon.nl. Everything else on the site is English.
      </p>

      {landing.hero_image && (
        <div className="relative overflow-hidden w-full mb-10" style={{ aspectRatio: "16/9", maxWidth: "860px" }}>
          {/* Hero alt describes the current image; update this string if the hero is swapped. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(landing.hero_image)}
            alt="Traditioneel Nederlandse stenen molen met witte wieken tegen een blauwe lucht, met zomerse boomtoppen in de voorgrond"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-prose mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
        <MDXRemote source={landing.body} />
      </div>

      <ActiesBlock acties={activeActies} />

      <section>
        <h2 className="font-display text-3xl text-ink mb-6">Categorieën</h2>
        <CategoryGrid categories={shippedCategories} />
      </section>
    </div>
  );
}
