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

const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  atmospheric: 'Moody landscape photography where the weather is the subject and the place is the setting. Fog, low cloud, water-heavy air, the particular grey that carries its own colour — never warm, never softened. Not only a photograph of somewhere, but the conditions that decided what the photograph could be.',
  halcyon:     'Warm-toned landscape photography — pink, peach, coral, warm gold, dusty lilac washing the whole frame. A grade the whole image lives inside, not a tint laid on top. Not only pretty light, but the kind of pretty that earns the second look because the composition holds underneath.',
  signature:   'Architecture photography at full attention — palette-agnostic, mood-agnostic, the building given the frame to itself. Not only a record of what\'s there, but the angle and the light that make the structure look like it could not have stood any other way.',
  mono:        'Black and white photography at its best — it plays between the contrasts of light and dark, finds the farthest edges between them, and puts them in one image. Not only stripping a photo to its essence, but finding a new truth.',
}

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  'wall-art':         'TODO: copy — Wall art description',
  'prints-posters':   'TODO: copy — Prints & posters description',
  'cards-stationery': 'TODO: copy — Cards & stationery description',
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
    title: `${col.displayName} — Shop`,
    description: `Shop ${col.displayName} — fine art prints and objects by StudioTJ.`,
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
          {col.displayName}
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
