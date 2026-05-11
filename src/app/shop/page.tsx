import type { Metadata } from 'next'
import { getAvailableGroups, groupDefaultVariant, COLLECTION_CONFIG } from '@/lib/catalogue'
import ShopCollectionCard from '@/components/ShopCollectionCard'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Fine art prints from StudioTJ — photographs from the Netherlands, printed on demand and shipped worldwide.',
}

// TODO: copy — replace placeholder descriptions before launch
const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  atmospheric: 'TODO: copy — Atmospheric collection description',
  halcyon:     'TODO: copy — Halcyon collection description',
  mono:        'TODO: copy — Mono collection description',
  signature:   'TODO: copy — Signature collection description',
}

export default function ShopPage() {
  const allProducts = getAvailableGroups()

  const collections = COLLECTION_CONFIG.map((col) => {
    const products = allProducts.filter((g) => g.collection === col.key)
    const heroImages = products
      .map((g) => {
        const v = groupDefaultVariant(g)
        return v.hero ?? v.mock1 ?? null
      })
      .filter((url): url is string => url !== null)

    return {
      ...col,
      description: COLLECTION_DESCRIPTIONS[col.slug] ?? '',
      heroImages,
    }
  })

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-3">StudioTJ</p>
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mb-6">
          Shop
        </h1>
        <p className="text-muted max-w-md leading-relaxed">
          Fine art prints and objects. Printed on demand, finished to last.
        </p>
      </div>

      {/* Collection grid — 2 × 2 on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-14">
        {collections.map((col) => (
          <ShopCollectionCard
            key={col.slug}
            slug={col.slug}
            name={col.name}
            description={col.description}
            heroImages={col.heroImages}
          />
        ))}
      </div>

      {/* Info copy */}
      <div className="max-w-prose space-y-5 text-muted leading-relaxed mt-16 pt-12 border-t border-dust/30">
        <p>The shop is photography made physical. Prints first — pictures on paper, sized for walls, made on archival papers with pigment-based inks, finished to hold up over years rather than seasons. A photograph on a wall holds the eye in a way a screen never quite does.</p>
        <p>Objects extend the work past the frame — the photograph carried onto something used, read, sent, held, kept at hand. Where a print is looked at, an object is also lived with. The picture is the same; the form is the difference.</p>
        <p>Print on demand is the production model. Each item is made when it is ordered.</p>
        <p>The catalogue is curated one piece at a time. Each piece is here because it deserves to be — to be owned, lived with, looked at often. The kind of work a room is better for.</p>
      </div>
    </div>
  )
}
