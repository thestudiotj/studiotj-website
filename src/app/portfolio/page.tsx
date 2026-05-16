import type { Metadata } from 'next'
import Link from 'next/link'
import { getPortfolio, sortCollections } from '@/lib/portfolio'
import type { Photo } from '@/lib/portfolio'
import CollectionCard from '@/components/CollectionCard'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { PORTFOLIO_HUB_BODY } from '@/data/collection-bodies'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Photography collections by StudioTJ — architecture, landscape, and light in the Netherlands.',
}

export default function PortfolioPage() {
  const data = getPortfolio()
  const collections = data ? sortCollections(data.collections, data.photos) : []
  const photoMap: Map<string, Photo> = data
    ? new Map(data.photos.map(p => [p.id, p]))
    : new Map()

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="pt-32 pb-16 px-6 md:px-12">
        <p className="text-muted text-xs tracking-[0.3em] uppercase mb-4">StudioTJ</p>
        {/* Alternate (noun-forward) — swap by uncommenting and removing the primary below:
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6">
          Dutch architecture, landscape, and light
        </h1>
        <p className="text-muted text-lg max-w-xl leading-relaxed">
          Four collections in colour and black and white — the Netherlands, looked at carefully.
        </p>
        */}
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6">
          Photography of the Netherlands, looked at carefully
        </h1>
        <p className="text-muted text-lg max-w-xl leading-relaxed">
          Architecture, landscape, and light, across four collections in colour and black and white.
        </p>
      </div>

      {/* Divider */}
      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>

      {/* Collections grid */}
      {collections.length === 0 ? (
        <div className="px-6 md:px-12 py-20 text-center">
          <p className="text-muted">No collections found. Add a portfolio.json to public/.</p>
        </div>
      ) : (
        <div className="px-6 md:px-12 pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {collections.map((collection, i) => {
                const photos: Photo[] = collection.photo_ids
                  .map(id => photoMap.get(id))
                  .filter((p): p is Photo => p !== undefined)
                return (
                  <CollectionCard
                    key={collection.slug}
                    collection={collection}
                    photos={photos}
                    index={i}
                    size="large"
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hub body block */}
      <div className="px-6 md:px-12 mb-12">
        <div className="h-px bg-dust/40" />
      </div>
      <div className="px-6 md:px-12 pb-24">
        <div className="collection-description text-muted">
          <MDXRemote source={PORTFOLIO_HUB_BODY} />
        </div>
      </div>

      {/* Also here — quiet corners list */}
      <section className="border-t border-dust/40 px-6 md:px-12 py-20">
        <h2 className="section-title mb-8">Also here</h2>
        <ul className="space-y-4 max-w-2xl">
          <li>
            <Link href="/series" className="group inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-2xl text-ink group-hover:text-muted transition-colors">Series</span>
              <span className="text-muted text-sm">— ongoing sequences, kept in the order they happened</span>
            </Link>
          </li>
          <li>
            <Link href="/blog" className="group inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-2xl text-ink group-hover:text-muted transition-colors">Blog</span>
              <span className="text-muted text-sm">— writing from around the work</span>
            </Link>
          </li>
          <li>
            <Link href="/subtext-lab" className="group inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-2xl text-ink group-hover:text-muted transition-colors">Subtext Lab</span>
              <span className="text-muted text-sm">— essays and video on media and society</span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
