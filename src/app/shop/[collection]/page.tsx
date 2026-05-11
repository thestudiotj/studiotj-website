import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAvailableGroups,
  COLLECTION_CONFIG,
  SLUG_TO_COLLECTION,
} from '@/lib/catalogue'
import { FAMILY_CONFIG, SLUG_TO_FAMILY } from '@/lib/catalogue/families'
import ShopGrid from '@/components/ShopGrid'
import ShopFamilyGrid from '@/components/ShopFamilyGrid'
import ShopPageShell from '@/components/ShopPageShell'
import Breadcrumb from '@/components/Breadcrumb'

// TODO: copy — replace placeholder descriptions before launch
const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  atmospheric: 'TODO: copy — Atmospheric collection description',
  halcyon:     'TODO: copy — Halcyon collection description',
  mono:        'TODO: copy — Mono collection description',
  signature:   'TODO: copy — Signature collection description',
}

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  'wall-art':         'TODO: copy — Wall art description',
  'prints-posters':   'TODO: copy — Prints & posters description',
  'cards-stationery': 'TODO: copy — Cards & stationery description',
  'books':            'TODO: copy — Books description',
}

export function generateStaticParams() {
  const collectionParams = COLLECTION_CONFIG.map(({ slug }) => ({ collection: slug }))
  const familyParams = FAMILY_CONFIG.map(({ slug }) => ({ collection: slug }))
  return [...collectionParams, ...familyParams]
}

export async function generateMetadata(
  { params }: { params: { collection: string } }
): Promise<Metadata> {
  const family = SLUG_TO_FAMILY[params.collection]
  if (family) {
    return {
      title: `${family.name} — Shop`,
      description: `Shop ${family.name.toLowerCase()} — fine art prints and objects by StudioTJ.`,
    }
  }

  const col = COLLECTION_CONFIG.find((c) => c.slug === params.collection)
  if (!col) return { title: 'Collection not found' }
  return {
    title: `${col.name} — Shop`,
    description: `Shop the ${col.name} collection — fine art prints and objects by StudioTJ.`,
  }
}

export default function CollectionOrFamilyPage({
  params,
}: {
  params: { collection: string }
}) {
  const { collection: segment } = params

  // ── Family browse page ────────────────────────────────────────────────────
  const familyMeta = SLUG_TO_FAMILY[segment]
  if (familyMeta) {
    const allProducts = getAvailableGroups()
    const familyProducts = allProducts.filter((g) =>
      familyMeta.familyCodes.includes(g.family)
    )

    return (
      <ShopPageShell>
        <Breadcrumb
          segments={[
            { label: 'Shop', href: '/shop' },
            { label: familyMeta.name },
          ]}
        />

        <div className="mb-10 mt-8">
          <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mb-4">
            {familyMeta.name}
          </h1>
          <p className="text-muted max-w-md leading-relaxed">
            {FAMILY_DESCRIPTIONS[segment] ?? ''}
          </p>
        </div>

        <ShopFamilyGrid products={familyProducts} familyMeta={familyMeta} />
      </ShopPageShell>
    )
  }

  // ── Collection browse page ─────────────────────────────────────────────────
  const col = COLLECTION_CONFIG.find((c) => c.slug === segment)
  if (!col) notFound()

  const collectionKey = SLUG_TO_COLLECTION[segment]
  const products = getAvailableGroups().filter((g) => g.collection === collectionKey)

  return (
    <ShopPageShell>
      <Breadcrumb
        segments={[
          { label: 'Shop', href: '/shop' },
          { label: col.name },
        ]}
      />

      <div className="mb-10 mt-8">
        <h1 className="font-display text-5xl md:text-7xl text-ink leading-none mb-4">
          {col.name}
        </h1>
        <p className="text-muted max-w-md leading-relaxed">
          {COLLECTION_DESCRIPTIONS[segment] ?? ''}
        </p>
      </div>

      {products.length > 0 ? (
        <ShopGrid products={products} />
      ) : (
        <div className="flex flex-col items-center text-center max-w-xl mx-auto py-20">
          <h2 className="font-display text-3xl mb-4">Coming soon</h2>
          <p className="text-muted leading-relaxed">
            Products for this collection will appear here when they&apos;re ready.
          </p>
        </div>
      )}
    </ShopPageShell>
  )
}
