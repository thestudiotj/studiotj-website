import CollectionCard from '@/components/CollectionCard'
import { getPortfolio, sortCollections } from '@/lib/portfolio'
import type { Photo } from '@/lib/portfolio'

interface RelatedCollectionsProps {
  currentSlug: string
  fg: string
  border: string
}

export default function RelatedCollections({ currentSlug, fg, border }: RelatedCollectionsProps) {
  const data = getPortfolio()
  if (!data) return null

  const sorted = sortCollections(data.collections, data.photos)
  const others = sorted.filter(c => c.slug !== currentSlug)
  const photoMap = new Map(data.photos.map(p => [p.id, p]))

  return (
    <div
      className="px-6 md:px-12 pt-12 pb-16"
      style={{ borderTop: `1px solid ${border}` }}
    >
      <p
        className="text-xs tracking-[0.2em] uppercase mb-8"
        style={{ color: fg, opacity: 0.5 }}
      >
        Also in the portfolio
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
        {others.map((collection, i) => {
          const photos: Photo[] = collection.photo_ids
            .map(id => photoMap.get(id))
            .filter((p): p is Photo => p !== undefined)
          return (
            <CollectionCard
              key={collection.slug}
              collection={collection}
              photos={photos}
              index={i}
              size="small"
            />
          )
        })}
      </div>
    </div>
  )
}
