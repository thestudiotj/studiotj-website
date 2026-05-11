import {
  getGroupById,
  getAllGroups,
  groupMinPriceCents,
  COLLECTION_CONFIG,
  SLUG_TO_COLLECTION,
  COLLECTION_TO_SLUG,
} from '@/lib/catalogue'
import type { GroupedProduct } from '@/lib/catalogue'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'
import ShopPageShell from '@/components/ShopPageShell'

const PRODUCT_URL = (collection: string, id: string) =>
  `https://studiotj.com/shop/${collection}/${id}`

function getPlainDescription(group: GroupedProduct): string {
  const raw = group.description.trim()
  return raw.length >= 40 ? raw : `${group.title} — a StudioTJ print, shipped worldwide.`
}

function buildJsonLd(group: GroupedProduct, collection: string) {
  const minPrice = groupMinPriceCents(group)
  const priceStr = (minPrice / 100).toFixed(2)
  const defaultVariant = group.variants[Math.min(group.default_variant, group.variants.length - 1)]
  const heroImage = defaultVariant.hero ?? defaultVariant.mock1

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: group.title,
    description: getPlainDescription(group),
    ...(heroImage ? { image: [heroImage] } : {}),
    sku: group.id,
    brand: { '@type': 'Brand', name: 'StudioTJ' },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: priceStr,
      priceCurrency: 'EUR',
      availability: group.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: PRODUCT_URL(collection, group.id),
    },
  }
}

export function generateStaticParams() {
  return getAllGroups()
    .filter((g) => COLLECTION_TO_SLUG[g.collection])
    .map((g) => ({
      collection: COLLECTION_TO_SLUG[g.collection],
      id: g.id,
    }))
}

export async function generateMetadata({
  params,
}: {
  params: { collection: string; id: string }
}) {
  const group = getGroupById(params.id)
  if (!group) return { title: 'Product not found' }

  const description = getPlainDescription(group).slice(0, 160)
  const minPrice = (groupMinPriceCents(group) / 100).toFixed(2)
  const defaultVariant = group.variants[Math.min(group.default_variant, group.variants.length - 1)]
  const heroImage = defaultVariant.hero ?? defaultVariant.mock1

  return {
    title: group.title,
    description,
    openGraph: {
      type: 'website',
      title: group.title,
      description,
      ...(heroImage ? { images: [heroImage] } : {}),
    },
    other: {
      'og:type': 'product',
      'product:price:amount': minPrice,
      'product:price:currency': 'EUR',
      'product:availability': group.available ? 'instock' : 'oos',
    },
  }
}

export default function ProductPage({
  params,
}: {
  params: { collection: string; id: string }
}) {
  const col = COLLECTION_CONFIG.find((c) => c.slug === params.collection)
  if (!col) notFound()

  const group = getGroupById(params.id)
  if (!group) notFound()

  // Ensure the product actually belongs to this collection
  if (COLLECTION_TO_SLUG[group.collection] !== params.collection) notFound()

  const jsonLd = buildJsonLd(group, params.collection)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShopPageShell>
        <ProductDetail
          group={group}
          collectionSlug={params.collection}
          collectionName={col.name}
          noPadding
        />
      </ShopPageShell>
    </>
  )
}
