'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/catalogue'
import { useCart } from '@/lib/cart'
import ProductGallery from '@/components/ProductGallery'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export default function ProductDetail({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const { addItem, openDrawer } = useCart()

  const price = product.price_cents != null ? formatPrice(product.price_cents) : null

  function handleAddToCart() {
    if (product.price_cents == null) return
    addItem({
      productId: product.id,
      productTitle: product.title,
      price: product.price_cents,
      imageUrl: product.hero_image,
    })
    setAdded(true)
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  const gallery = (
    <ProductGallery
      images={[{ src: product.hero_image }]}
      productTitle={product.title}
    />
  )

  const titleAndPrice = (
    <>
      <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">
        {product.title}
      </h1>
      <p className="text-2xl text-ink mb-6">
        {price ?? <span className="text-muted text-base">—</span>}
      </p>
    </>
  )

  const addToCart = (
    <div className="flex flex-col gap-3 mb-8">
      <button
        onClick={handleAddToCart}
        disabled={product.price_cents == null}
        className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {added
          ? 'Added to cart ✓'
          : price
          ? `Add to Cart — ${price}`
          : 'Add to Cart'}
      </button>
    </div>
  )

  const description = product.description && (
    <div className="border-t border-dust/30 pt-8">
      <p className="text-xs tracking-widest uppercase text-muted mb-4">Details</p>
      <p className="text-sm text-muted leading-relaxed">{product.description}</p>
    </div>
  )

  const printNote = (
    <div className="border-t border-dust/30 mt-8 pt-6">
      <p className="text-xs text-muted leading-relaxed">
        Printed on archival paper. Delivery 5–10 business days.
        Ships from the nearest fulfilment partner to your address.
      </p>
    </div>
  )

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      {/* Back link */}
      <Link
        href="/shop"
        className="text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10"
      >
        <span>←</span> Shop
      </Link>

      {/*
        Layout strategy:
        - Mobile (flex-col): title/price → gallery → add-to-cart → description
        - Desktop (grid 2-col): gallery left (spanning both rows), info right
      */}
      <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-20">
        {/* Title + price — mobile: 1st. Desktop: right col top */}
        <div className="order-1 md:order-none md:col-start-2 md:row-start-1 mb-6 md:mb-0">
          {titleAndPrice}
        </div>

        {/* Gallery — mobile: 2nd. Desktop: left col, both rows */}
        <div className="order-2 md:order-none md:col-start-1 md:row-start-1 md:row-span-2 mb-8 md:mb-0">
          {gallery}
        </div>

        {/* Add-to-cart + description — mobile: 3rd. Desktop: right col bottom */}
        <div className="order-3 md:order-none md:col-start-2 md:row-start-2 flex flex-col">
          {addToCart}
          {description}
          {printNote}
        </div>
      </div>
    </div>
  )
}
