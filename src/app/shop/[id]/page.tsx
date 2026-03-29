import { getProductById } from '@/lib/printify'
import { notFound } from 'next/navigation'
import ProductDetail from './ProductDetail'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.title,
    description: product.description?.replace(/<[^>]+>/g, '').slice(0, 160),
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) notFound()
  return <ProductDetail product={product} />
}
