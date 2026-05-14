import type { Metadata } from 'next'
import {
  getDisplayGroups,
  groupDefaultVariant,
  displayGroupFamilyCodes,
  COLLECTION_CONFIG,
} from '@/lib/catalogue'
import { COLLECTION_COPY, type CollectionSlug } from '@/lib/catalogue/collections'
import { FAMILY_CONFIG, FAMILY_COPY, type FamilySlug } from '@/lib/catalogue/families'
import ShopCollectionCard from '@/components/ShopCollectionCard'
import ShopGrid from '@/components/ShopGrid'
import ShopNotesStrip from '@/components/ShopNotesStrip'
import { getAllShopNotes } from '@/lib/catalogue/shop-notes'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Fine art prints from StudioTJ — photographs from the Netherlands, printed on demand and shipped worldwide.',
}

// Families whose hero pool skips certain codes (cal is unavailable)
const FAMILY_HERO_CODES: Record<string, string[]> = {
  'wall-art':        ['can', 'fap'],
  'prints-posters':  ['hpr', 'hge', 'ema', 'clp'],
  'cards-stationery': ['gre', 'pos'],
}

export default function ShopPage() {
  const allProducts = getDisplayGroups()
  const shopNotes = getAllShopNotes()

  const collections = COLLECTION_CONFIG.map((col) => {
    const products = allProducts.filter((g) => g.available && g.collection === col.key)
    const heroImages = products
      .map((g) => {
        const v = groupDefaultVariant(g)
        return v.hero ?? v.mock1 ?? null
      })
      .filter((url): url is string => url !== null)

    return {
      ...col,
      description: COLLECTION_COPY[col.slug as CollectionSlug]?.tile ?? '',
      heroImages,
    }
  })

  const families = FAMILY_CONFIG.map((fam) => {
    const codes = FAMILY_HERO_CODES[fam.slug] ?? fam.familyCodes
    const products = allProducts.filter((g) =>
      displayGroupFamilyCodes(g).some((code) => codes.includes(code)),
    )
    const heroImages = products
      .map((g) => {
        const v = groupDefaultVariant(g)
        return v.hero ?? v.mock1 ?? null
      })
      .filter((url): url is string => url !== null)

    return {
      ...fam,
      description: FAMILY_COPY[fam.slug as FamilySlug]?.tile ?? '',
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
        <p className="text-sm text-muted/80 max-w-md leading-relaxed mt-2">
          Archival prints across papers, canvas, and frames, printed in the EU and shipped worldwide.
        </p>
      </div>

      {/* Shop by collection */}
      <div className="mb-14">
        <h2 className="text-xs tracking-[0.3em] uppercase text-muted mb-8">Shop by collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-14">
          {collections.map((col) => (
            <ShopCollectionCard
              key={col.slug}
              slug={col.slug}
              name={col.displayName}
              description={col.description}
              heroImages={col.heroImages}
            />
          ))}
        </div>
      </div>

      {/* Shop by product */}
      <div className="mb-16 pt-10 border-t border-dust/30">
        <h2 className="text-xs tracking-[0.3em] uppercase text-muted mb-8">Shop by product</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {families.map((fam) => (
            <ShopCollectionCard
              key={fam.slug}
              slug={fam.slug}
              name={fam.name}
              description={fam.description}
              heroImages={fam.heroImages}
              ctaText="Browse products →"
            />
          ))}
        </div>
      </div>

      {/* Studio notes — working observations about each collection */}
      <ShopNotesStrip notes={shopNotes} />

      {/* Browse all — compact grid with location filter + sort */}
      <div className="mb-16 pt-10 border-t border-dust/30">
        <h2 className="text-xs tracking-[0.3em] uppercase text-muted mb-8">Browse all</h2>
        <ShopGrid products={allProducts.filter((g) => g.available)} compact />
      </div>

      {/* Info copy */}
      <div className="max-w-prose space-y-5 text-muted leading-relaxed pt-12 border-t border-dust/30">
        <p>The shop is photography made physical. Prints first — pictures on paper, sized for walls, made on archival papers with pigment-based inks, finished to hold up over years rather than seasons. A photograph on a wall holds the eye in a way a screen never quite does.</p>
        <p>Objects extend the work past the frame — the photograph carried onto something used, read, sent, held, kept at hand. Where a print is looked at, an object is also lived with. The picture is the same; the form is the difference.</p>
        <p>Print on demand is the production model. Each item is made when it is ordered.</p>
        <p>The catalogue is curated one piece at a time. Each piece is here because it deserves to be — to be owned, lived with, looked at often. The kind of work a room is better for.</p>
      </div>
    </div>
  )
}
