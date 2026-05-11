import { getGroupById, groupMinPriceCents } from '@/lib/catalogue'
import type { GroupedProduct } from '@/lib/catalogue'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'

const PRODUCT_URL = (id: string) => `https://studiotj.com/shop/${id}`

function getPlainDescription(group: GroupedProduct): string {
  const raw = group.description.trim()
  return raw.length >= 40 ? raw : `${group.title} — a StudioTJ print, shipped worldwide.`
}

function buildJsonLd(group: GroupedProduct) {
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
      url: PRODUCT_URL(group.id),
    },
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
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

export default function ProductPage({ params }: { params: { id: string } }) {
  const group = getGroupById(params.id)
  if (!group) notFound()

  const jsonLd = buildJsonLd(group)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail group={group} />
    </>
  )
}
