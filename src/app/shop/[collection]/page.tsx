import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getAvailableDisplayGroups,
  displayGroupFamilyCodes,
  COLLECTION_CONFIG,
  SLUG_TO_COLLECTION,
} from '@/lib/catalogue'
import { COLLECTION_COPY, type CollectionSlug } from '@/lib/catalogue/collections'
import { FAMILY_CONFIG, SLUG_TO_FAMILY, FAMILY_COPY, type FamilySlug } from '@/lib/catalogue/families'
import { LEARN_TEASERS } from '@/lib/catalogue/learn-teasers'
import ShopGrid from '@/components/ShopGrid'
import ShopFamilyGrid from '@/components/ShopFamilyGrid'
import ShopPageShell from '@/components/ShopPageShell'
import Breadcrumb from '@/components/Breadcrumb'

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
    const allProducts = getAvailableDisplayGroups()
    const familyProducts = allProducts.filter((g) =>
      displayGroupFamilyCodes(g).some((code) => familyMeta.familyCodes.includes(code)),
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
            {FAMILY_COPY[segment as FamilySlug]?.page ?? ''}
          </p>
        </div>

        <div className="mb-10 pb-8 border-b border-dust/30">
          <p className="text-xs tracking-widest uppercase text-dust mb-3">Materials</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {familyMeta.familyCodes.map((code) => {
              const teaser = LEARN_TEASERS[code]
              if (!teaser) return null
              return (
                <li key={code}>
                  <Link
                    href={`/shop/learn/${code}`}
                    className="text-sm tracking-widest uppercase text-muted hover:text-ink transition-colors"
                  >
                    {teaser.displayName} →
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <ShopFamilyGrid products={familyProducts} familyMeta={familyMeta} />
      </ShopPageShell>
    )
  }

  // ── Collection browse page ─────────────────────────────────────────────────
  const col = COLLECTION_CONFIG.find((c) => c.slug === segment)
  if (!col) notFound()

  const collectionKey = SLUG_TO_COLLECTION[segment]
  const products = getAvailableDisplayGroups().filter((g) => g.collection === collectionKey)

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
          {COLLECTION_COPY[segment as CollectionSlug]?.page ?? ''}
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
