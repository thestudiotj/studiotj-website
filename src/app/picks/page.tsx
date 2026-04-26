import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadLanding, loadActiveCategories, loadCategoryIntro } from "@/lib/picks/loader";
import { PICKS_CATEGORY_LABELS } from "@/lib/picks/categories";
import { resolveR2 } from "@/lib/picks/paths";
import CategoryGrid from "@/components/picks/CategoryGrid";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Picks",
  description:
    "Brand pages by category — researched, curated, affiliate-linked via Impact. Photography, drawing, software, print, site and workflow, workspace.",
};

export default async function PicksPage() {
  const landing = loadLanding();
  const activeCategories = loadActiveCategories();

  const categoryEntries = activeCategories.map((cat) => {
    const intro = loadCategoryIntro(cat);
    if (intro) return { category: cat, title: intro.title, hero_image: intro.hero_image };
    return { category: cat, title: PICKS_CATEGORY_LABELS[cat], hero_image: '' };
  });

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      <h1 className="section-title mb-4">{landing.title}</h1>

      {landing.hero_image && (
        <div
          className="relative overflow-hidden w-full mb-10"
          style={{ aspectRatio: "16/9", maxWidth: "860px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(landing.hero_image)}
            alt="Picks"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-prose mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
        <MDXRemote source={landing.body} />
      </div>

      <section>
        <h2 className="font-display text-3xl text-ink mb-6">Categories</h2>
        <CategoryGrid categories={categoryEntries} />
      </section>
    </div>
  );
}
