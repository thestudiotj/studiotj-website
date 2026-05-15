import Link from "next/link";
import { resolveR2 } from "@/lib/picks/paths";
import { resolveAspect } from "@/lib/picks/imageAspect";
import type { Article } from "@/lib/picks/schemas";

interface ArticleCardProps {
  article: Article;
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

export default function ArticleCard({ article }: ArticleCardProps) {
  const aspectRatio = resolveAspect(article.hero_image, "article_hero", article.hero_aspect);

  return (
    <Link href={`/picks/articles/${article.slug}`} className="group block">
      <div className="relative overflow-hidden mb-3" style={{ aspectRatio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveR2(article.hero_image)}
          alt={article.hero_image_alt}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>
      <p className="font-display text-xl text-ink leading-tight mb-2 group-hover:text-accent transition-colors">
        {article.title}
      </p>
      <p className="text-sm text-muted leading-relaxed mb-2">{article.description}</p>
      <p className="text-xs tracking-widest uppercase text-muted">
        {formatDate(article.published_date)}
      </p>
    </Link>
  );
}
