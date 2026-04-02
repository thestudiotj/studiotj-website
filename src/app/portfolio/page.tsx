import { getPortfolio, getPhoto } from '@/lib/portfolio'
import CollectionCard from '@/components/CollectionCard'

export const metadata = {
  title: 'Portfolio',
  description: 'Photography collections by StudioTJ — architecture, landscape, and light in the Netherlands.',
}

export default function PortfolioPage() {
  const data = getPortfolio()
  const collections = data?.collections ?? []

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="pt-32 pb-16 px-6 md:px-12">
        <p className="text-muted text-xs tracking-[0.3em] uppercase mb-4">StudioTJ</p>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-tight mb-6">
          The work
        </h1>
        <p className="text-muted text-lg max-w-xl leading-relaxed">
          Collections from the Netherlands — light, geometry, and the texture of places that reward a second look.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {collections.map((collection, i) => {
              const heroPhoto = collection.hero_photo_id
                ? getPhoto(collection.hero_photo_id)
                : null
              return (
                <CollectionCard
                  key={collection.slug}
                  collection={collection}
                  heroPhoto={heroPhoto}
                  index={i}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
