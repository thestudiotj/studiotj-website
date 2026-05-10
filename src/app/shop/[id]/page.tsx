import { getProductBySlug } from '@/lib/catalogue'
import type { Product } from '@/lib/catalogue'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'

const PRODUCT_URL = (id: string) => `https://studiotj.com/shop/${id}`

function getPlainDescription(product: Product): string {
  const raw = product.description.trim()
  return raw.length >= 40 ? raw : `${product.title} — a StudioTJ print, shipped worldwide.`
}

function buildJsonLd(product: Product) {
  const price = product.price_cents != null ? (product.price_cents / 100).toFixed(2) : null

  const offer = price
    ? {
        '@type': 'Offer',
        price,
        priceCurrency: 'EUR',
        availability: product.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        url: PRODUCT_URL(product.id),
      }
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: getPlainDescription(product),
    image: [product.hero_image],
    sku: product.id,
    brand: { '@type': 'Brand', name: 'StudioTJ' },
    ...(offer ? { offers: offer } : {}),
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = getProductBySlug(params.id)
  if (!product) return { title: 'Product not found' }

  const description = getPlainDescription(product).slice(0, 160)
  const price = product.price_cents != null ? (product.price_cents / 100).toFixed(2) : null

  return {
    title: product.title,
    description,
    openGraph: {
      type: 'website',
      title: product.title,
      description,
      images: [product.hero_image],
    },
    ...(price
      ? {
          other: {
            'og:type': 'product',
            'product:price:amount': price,
            'product:price:currency': 'EUR',
            'product:availability': product.available ? 'instock' : 'oos',
          },
        }
      : {}),
  }
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProductBySlug(params.id)
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
