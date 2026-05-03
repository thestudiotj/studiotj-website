import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadLanding, loadActiveCategories, loadCategoryIntro } from "@/lib/gear/loader";
import { GEAR_CATEGORY_LABELS } from "@/lib/gear/categories";
import { resolveR2 } from "@/lib/gear/paths";
import CategoryGrid from "@/components/gear/CategoryGrid";

export const metadata: Metadata = {
  title: "My Gear",
  description: "What I carry, what I shoot with, what I'd add next.",
};

function extractFirstLine(body: string): string {
  return body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)[0] ?? "";
}

export default async function GearPage() {
  const landing = loadLanding();
  const activeCategories = loadActiveCategories();

  const categoryEntries = activeCategories.map((cat) => {
    const intro = loadCategoryIntro(cat);
    if (intro) {
      return {
        category: cat,
        title: intro.title,
        description: extractFirstLine(intro.body),
      };
    }
    return { category: cat, title: GEAR_CATEGORY_LABELS[cat], description: "" };
  });

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-title mb-4">{landing.title}</h1>
        {landing.description && (
          <p className="text-muted text-lg leading-relaxed">{landing.description}</p>
        )}
      </div>

      {landing.hero_image && (
        <div className="relative overflow-hidden aspect-video mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(landing.hero_image)}
            alt="My Gear"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Categories */}
      <section className="mb-10">
        <h2 className="font-display text-3xl text-ink mb-6">Categories</h2>
        <CategoryGrid categories={categoryEntries} />
      </section>

      {/* Info copy */}
      {landing.body.trim() && (
        <div className="prose prose-lg max-w-prose pt-12 border-t border-dust/30 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={landing.body} />
        </div>
      )}
    </div>
  );
}
