import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLanding, getActiveActies, getProducts, getCategoryIntro } from "@/lib/vondsten/loader";
import { CATEGORIES } from "@/lib/vondsten/schemas";
import { resolveR2 } from "@/lib/vondsten/paths";
import ActiesBlock from "@/components/vondsten/ActiesBlock";
import CategoryGrid from "@/components/vondsten/CategoryGrid";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Vondsten",
  description:
    "Productpagina's per categorie — onderzocht, gecureerd, op amazon.nl. Affiliate-links via het Amazon Partnerprogramma.",
};

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
      <h1 className="section-title mb-4">{landing.title}</h1>

      {landing.hero_image && (
        <div className="relative overflow-hidden w-full mb-10" style={{ aspectRatio: "16/9", maxWidth: "860px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(landing.hero_image)}
            alt="Vondsten"
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
