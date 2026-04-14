import { getProductById, getEnabledVariants, getPriceRange, getDefaultImage } from '@/lib/printify'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) return { title: 'Product not found' }

  const rawDescription = product.description?.replace(/<[^>]+>/g, '').trim() ?? ''
  const description =
    rawDescription.length >= 40
      ? rawDescription.slice(0, 160)
      : `${product.title} — a StudioTJ print available as ${product.tags[0] ?? 'fine art print'}, shipped worldwide via Printify partners.`

  const defaultImage = getDefaultImage(product)
  const variants = getEnabledVariants(product)
  const { min, max } = getPriceRange(product)
  // Prices from Printify are in cents
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
      'product:price:amount': singlePrice ? lowPrice : lowPrice,
      'product:price:currency': 'EUR',
      'product:availability': 'instock',
      ...(singlePrice ? {} : { 'product:price:amount:high': highPrice }),
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) notFound()
  return <ProductDetail product={product} />
}
