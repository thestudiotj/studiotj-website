import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  loadLanding,
  loadActiveCategories,
  loadCategoryIntro,
  loadArticles,
} from "@/lib/picks/loader";
import { PICKS_CATEGORY_LABELS } from "@/lib/picks/categories";
import { resolveR2 } from "@/lib/picks/paths";
import CategoryGrid from "@/components/picks/CategoryGrid";
import ArticleDisclosure from "@/components/picks/ArticleDisclosure";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const landing = loadLanding();
  return {
    title: "Picks — Brands worth recommending",
    description: landing.description,
  };
}

function extractFirstLine(body: string): string {
  return body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)[0] ?? "";
}

export default async function PicksPage() {
  const landing = loadLanding();
  const activeCategories = loadActiveCategories();
  const recentArticles = loadArticles().slice(0, 3);

  const categoryEntries = activeCategories.map((cat) => {
    const intro = loadCategoryIntro(cat);
    if (intro) {
      return {
        category: cat,
        title: intro.title,
        description: extractFirstLine(intro.body),
      };
    }
    return { category: cat, title: PICKS_CATEGORY_LABELS[cat], description: "" };
  });

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      <h1 className="section-title mb-4">{landing.title}</h1>

      {landing.description && (
        <p className="text-muted text-lg leading-relaxed mb-8 max-w-prose">
          {landing.description}
        </p>
      )}

      <ArticleDisclosure />

      {landing.hero_image && (
        <div
          className="relative overflow-hidden w-full mb-10"
          style={{ aspectRatio: "16/9", maxWidth: "860px" }}
        >
          {/* Hero alt describes the current image; update this string if the hero is swapped. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveR2(landing.hero_image)}
            alt="StudioTJ curation still — a working surface from the studio, photographed by Tjeerd van der Heeft"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-prose mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
        <MDXRemote source={landing.body} />
      </div>

      <section className="mb-12">
        <h2 className="font-display text-3xl text-ink mb-6">Categories</h2>
        <CategoryGrid categories={categoryEntries} />
      </section>

      {recentArticles.length > 0 && (
        <section className="border-t border-dust/30 pt-8">
          <h2 className="text-xs tracking-widest uppercase text-muted mb-4">Articles</h2>
          <ul className="space-y-3 max-w-prose mb-4">
            {recentArticles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/picks/articles/${a.slug}`}
                  className="text-ink hover:text-muted transition-colors"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/picks/articles"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            All articles →
          </Link>
        </section>
      )}
    </div>
  );
}
