import { getProductById, getEnabledVariants, getPriceRange, getDefaultImage } from '@/lib/printify'
import type { PrintifyProduct } from '@/lib/printify'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'

const PRODUCT_URL = (id: string) => `https://studiotj.com/shop/${id}`

function getPlainDescription(product: PrintifyProduct): string {
  const raw = product.description?.replace(/<[^>]+>/g, '').trim() ?? ''
  return raw.length >= 40
    ? raw
    : `${product.title} — a StudioTJ print available as ${product.tags[0] ?? 'fine art print'}, shipped worldwide via Printify partners.`
}

function buildJsonLd(product: PrintifyProduct) {
  const { min, max } = getPriceRange(product)
  const lowPrice = (min / 100).toFixed(2)
  const highPrice = (max / 100).toFixed(2)
  const singlePrice = min === max
  const enabledVariants = getEnabledVariants(product)

  const offer = singlePrice
    ? {
        '@type': 'Offer',
        price: lowPrice,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        url: PRODUCT_URL(product.id),
      }
    : {
        '@type': 'AggregateOffer',
        lowPrice,
        highPrice,
        priceCurrency: 'EUR',
        offerCount: enabledVariants.length,
        availability: 'https://schema.org/InStock',
        url: PRODUCT_URL(product.id),
      }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: getPlainDescription(product),
    image: product.images.map((img) => img.src),
    sku: product.id,
    brand: { '@type': 'Brand', name: 'StudioTJ' },
    offers: offer,
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) return { title: 'Product not found' }

  const description = getPlainDescription(product).slice(0, 160)
  const defaultImage = getDefaultImage(product)
  const { min, max } = getPriceRange(product)
  const lowPrice = (min / 100).toFixed(2)
  const highPrice = (max / 100).toFixed(2)
  const singlePrice = min === max

  return {
    title: product.title,
    description,
    openGraph: {
      type: 'website',
      title: product.title,
      description,
      ...(defaultImage ? { images: [defaultImage.src] } : {}),
    },
    other: {
      'og:type': 'product',
      'product:price:amount': lowPrice,
      'product:price:currency': 'EUR',
      'product:availability': 'instock',
      ...(singlePrice ? {} : { 'product:price:amount:high': highPrice }),
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) notFound()

  const jsonLd = buildJsonLd(product)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
    </>
  )
}
