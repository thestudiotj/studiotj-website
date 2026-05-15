import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadArticle, loadArticles } from "@/lib/picks/loader";
import type { Article } from "@/lib/picks/schemas";
import { resolveR2 } from "@/lib/picks/paths";
import { resolveAspect } from "@/lib/picks/imageAspect";
import { mdxComponents } from "@/components/mdx";
import AffiliateItem from "@/components/picks/AffiliateItem";
import ArticleCard from "@/components/picks/ArticleCard";
import ArticleDisclosure from "@/components/picks/ArticleDisclosure";

interface Props {
  params: Promise<{ slug: string }>;
}

const articleMdxComponents = { ...mdxComponents, AffiliateItem };

export function generateStaticParams() {
  return loadArticles().map((a) => ({ slug: a.slug }));
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function absoluteImageUrl(imagePath: string): string {
  return resolveR2(imagePath);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = loadArticle(slug);
  if (!article) return {};
  const heroUrl = absoluteImageUrl(article.hero_image);
  return {
    title: `${article.title} — Picks`,
    description: article.description,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      siteName: "StudioTJ",
      images: [heroUrl],
      publishedTime: article.published_date,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = loadArticle(slug);
  if (!article) notFound();

  const heroAspect = resolveAspect(article.hero_image, "article_hero", article.hero_aspect);
  const heroUrl = absoluteImageUrl(article.hero_image);

  const allArticles = loadArticles();
  const related: Article[] = article.related_articles
    .map((rs) => allArticles.find((a) => a.slug === rs))
    .filter((a): a is Article => a !== undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.published_date,
    image: heroUrl,
    author: {
      "@type": "Person",
      name: "Tjeerd van der Heeft",
    },
    publisher: {
      "@type": "Organization",
      name: "StudioTJ",
      url: "https://studiotj.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://studiotj.com/picks/articles/${article.slug}`,
    },
    description: article.description,
  };

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-xs tracking-widest uppercase text-muted mb-8 flex flex-wrap items-center gap-2">
        <Link href="/picks" className="hover:text-ink transition-colors">
          Picks
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/picks/articles" className="hover:text-ink transition-colors">
          Articles
        </Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">{article.title}</span>
      </nav>

      <div className="max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
          <div>
            <div className="relative overflow-hidden" style={{ aspectRatio: heroAspect }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroUrl}
                alt={article.hero_image_alt}
                className="w-full h-full object-cover"
              />
            </div>
            {article.attribution && (
              <p className="text-xs text-muted mt-2 leading-relaxed">{article.attribution}</p>
            )}
          </div>
          <div className="pt-0 md:pt-4">
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">
              {article.title}
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-4">{article.description}</p>
            <p className="text-xs tracking-widest uppercase text-muted">
              {formatDate(article.published_date)}
            </p>
          </div>
        </div>

        <ArticleDisclosure />

        <div className="prose prose-lg max-w-[640px] mb-10 prose-headings:font-display prose-headings:font-normal prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <MDXRemote source={article.body} components={articleMdxComponents} />
        </div>

        {related.length > 0 && (
          <section className="border-t border-dust/30 pt-8 mb-10">
            <h2 className="font-display text-2xl text-ink mb-6">Related articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
