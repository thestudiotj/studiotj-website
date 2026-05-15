import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadArticleIndex, loadArticles } from "@/lib/picks/loader";
import ArticleCard from "@/components/picks/ArticleCard";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const index = loadArticleIndex();
  return {
    title: index ? `${index.title} — Picks` : "Articles — Picks",
    description:
      "Editorial articles from StudioTJ — gear, brands, and the craft they support.",
  };
}

export default async function ArticlesIndexPage() {
  const index = loadArticleIndex();
  const articles = loadArticles();

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 max-w-5xl">
      <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex items-center gap-2">
        <Link href="/picks" className="hover:text-ink transition-colors">
          Picks
        </Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">Articles</span>
      </nav>

      <h1 className="section-title mb-6">{index?.title ?? "Articles"}</h1>

      {index && (
        <div className="prose prose-lg max-w-prose mb-12 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={index.body} />
        </div>
      )}

      {articles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
