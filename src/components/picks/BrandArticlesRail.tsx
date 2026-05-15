import { loadArticlesByBrand } from "@/lib/picks/loader";
import ArticleCard from "./ArticleCard";

interface BrandArticlesRailProps {
  brandSlug: string;
  brandName: string;
}

export default function BrandArticlesRail({ brandSlug, brandName }: BrandArticlesRailProps) {
  const articles = loadArticlesByBrand(brandSlug).slice(0, 3);
  if (articles.length === 0) return null;

  return (
    <section className="border-t border-dust/30 pt-8 mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">
        Recent articles featuring {brandName}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
