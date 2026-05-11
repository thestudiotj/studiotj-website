import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAvailableGroups,
  COLLECTION_CONFIG,
  SLUG_TO_COLLECTION,
} from '@/lib/catalogue'
import ShopGrid from '@/components/ShopGrid'
import Breadcrumb from '@/components/Breadcrumb'

// TODO: copy — replace placeholder descriptions before launch
const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  atmospheric: 'TODO: copy — Atmospheric collection description',
  halcyon:     'TODO: copy — Halcyon collection description',
  mono:        'TODO: copy — Mono collection description',
  signature:   'TODO: copy — Signature collection description',
}

export function generateStaticParams() {
  return COLLECTION_CONFIG.map(({ slug }) => ({ collection: slug }))
}

export async function generateMetadata(
  { params }: { params: { collection: string } }
): Promise<Metadata> {
  const col = COLLECTION_CONFIG.find((c) => c.slug === params.collection)
  if (!col) return { title: 'Collection not found' }
  return {
    title: `${col.name} — Shop`,
    description: `Shop the ${col.name} collection — fine art prints and objects by StudioTJ.`,
  }
}

export default function CollectionPage({
  params,
}: {
  params: { collection: string }
}) {
  const col = COLLECTION_CONFIG.find((c) => c.slug === params.collection)
  if (!col) notFound()

  const collectionKey = SLUG_TO_COLLECTION[params.collection]
  const products = getAvailableGroups().filter((g) => g.collection === collectionKey)

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
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
          {COLLECTION_DESCRIPTIONS[params.collection] ?? ''}
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
    </div>
  )
}
