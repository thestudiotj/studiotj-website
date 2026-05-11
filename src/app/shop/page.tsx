import type { Metadata } from 'next'
import { getAllGroups, groupDefaultVariant, COLLECTION_CONFIG } from '@/lib/catalogue'
import { FAMILY_CONFIG } from '@/lib/catalogue/families'
import ShopCollectionCard from '@/components/ShopCollectionCard'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Fine art prints from StudioTJ — photographs from the Netherlands, printed on demand and shipped worldwide.',
}

const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  atmospheric: 'Moody landscape photography where the weather is the subject.',
  halcyon:     'Warm-toned landscape photography — pink, peach, coral, gold.',
  mono:        'Black and white photography — contrast pushed to its edges.',
  signature:   'Architecture photography with the building given the frame to itself.',
}

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  'wall-art':         'Framed prints and stretched canvas — the photograph at the size it deserves, finished and ready to hang. Heavy paper or woven canvas, either way it arrives feeling like a real object.',
  'prints-posters':   'Fine art prints and posters on heavy art paper — substantial in the hand, matte enough to read cleanly on the wall. Frame to taste.',
  'cards-stationery': 'Greeting cards and postcards on heavy uncoated paper — weighty in the hand, soft enough to write on, with the matte finish that lets a photograph carry. Sent or kept.',
}

// Families whose hero pool skips certain codes (cal is unavailable)
const FAMILY_HERO_CODES: Record<string, string[]> = {
  'wall-art':        ['can', 'fap'],
  'prints-posters':  ['hpr', 'hge', 'ema', 'clp'],
  'cards-stationery': ['gre', 'pos'],
}

export default function ShopPage() {
  const allProducts = getAllGroups()

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
      description: COLLECTION_DESCRIPTIONS[col.slug] ?? '',
      heroImages,
    }
  })

  const families = FAMILY_CONFIG.map((fam) => {
    const codes = FAMILY_HERO_CODES[fam.slug] ?? fam.familyCodes
    const products = allProducts.filter((g) => codes.includes(g.family))
    const heroImages = products
      .map((g) => {
        const v = groupDefaultVariant(g)
        return v.hero ?? v.mock1 ?? null
      })
      .filter((url): url is string => url !== null)

    return {
      ...fam,
      description: FAMILY_DESCRIPTIONS[fam.slug] ?? '',
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

      {/* Shop by collection */}
      <div className="mb-14">
        <h2 className="text-xs tracking-[0.3em] uppercase text-muted mb-8">Shop by collection</h2>
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
