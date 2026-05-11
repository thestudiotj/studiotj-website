'use client'

import { useState, useMemo } from 'react'
import type { GroupedProduct, ProductVariant } from '@/lib/catalogue'
import { useCart } from '@/lib/cart'
import ProductGallery from '@/components/ProductGallery'
import Breadcrumb from '@/components/Breadcrumb'

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function colorLabel(color: string): string {
  const map: Record<string, string> = {
    black: 'Black Frame',
    'natural-oak': 'Natural Oak Frame',
    white: 'White Frame',
  }
  return map[color] ?? color
}

// ─── Variant picker ───────────────────────────────────────────────────────────

function PickerButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm border transition-colors ${
        active
          ? 'bg-ink text-paper border-ink'
          : 'border-dust/60 text-muted hover:border-ink hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

// ─── ProductDetail ────────────────────────────────────────────────────────────

export default function ProductDetail({
  group,
  collectionSlug,
  collectionName,
  noPadding = false,
}: {
  group: GroupedProduct
  collectionSlug: string
  collectionName: string
  noPadding?: boolean
}) {
  const defaultIdx = Math.min(group.default_variant, group.variants.length - 1)
  const defaultVariant = group.variants[defaultIdx]

  const [selectedSize, setSelectedSize] = useState(defaultVariant.size)
  const [selectedColor, setSelectedColor] = useState(defaultVariant.color ?? '')
  const [selectedPack, setSelectedPack] = useState(defaultVariant.pack ?? 0)
  const [added, setAdded] = useState(false)

  const { addItem, openDrawer } = useCart()

  const hasColor = group.variant_axes.includes('color')
  const hasPack = group.variant_axes.includes('pack')

  const sizes = useMemo(() => {
    const seen = new Set<string>()
    return group.variants
      .filter((v) => {
        if (seen.has(v.size)) return false
        seen.add(v.size)
        return true
      })
      .map((v) => ({ size: v.size, label: v.size_label }))
  }, [group.variants])

  const colors = useMemo(() => {
    if (!hasColor) return []
    const seen = new Set<string>()
    return group.variants
      .filter((v) => v.size === selectedSize && v.color && !seen.has(v.color) && seen.add(v.color!))
      .map((v) => v.color!)
  }, [group.variants, selectedSize, hasColor])

  const packs = useMemo(() => {
    if (!hasPack) return []
    const seen = new Set<number>()
    return group.variants
      .filter((v) => v.size === selectedSize && v.pack != null && !seen.has(v.pack!) && seen.add(v.pack!))
      .map((v) => v.pack!)
  }, [group.variants, selectedSize, hasPack])

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    return group.variants.find((v) => {
      if (v.size !== selectedSize) return false
      if (hasColor && v.color !== selectedColor) return false
      if (hasPack && v.pack !== selectedPack) return false
      return true
    })
  }, [group.variants, selectedSize, selectedColor, selectedPack, hasColor, hasPack])

  const activeVariant = selectedVariant ?? group.variants[defaultIdx]
  const price = formatPrice(activeVariant.price_cents)

  const galleryImages = useMemo(() => {
    const imgs: string[] = []
    if (activeVariant.hero) imgs.push(activeVariant.hero)
    if (group.photo_url) imgs.push(group.photo_url)
    if (activeVariant.mock1) imgs.push(activeVariant.mock1)
    if (activeVariant.mock2) imgs.push(activeVariant.mock2)
    if (group.example_image) imgs.push(group.example_image)
    return imgs.map((src) => ({ src }))
  }, [activeVariant, group.photo_url, group.example_image])

  function handleSizeChange(size: string) {
    setSelectedSize(size)
    if (hasColor) {
      const firstColorForSize = group.variants.find((v) => v.size === size)?.color ?? ''
      setSelectedColor(firstColorForSize)
    }
    if (hasPack) {
      const firstPackForSize = group.variants.find((v) => v.size === size)?.pack ?? 0
      setSelectedPack(firstPackForSize)
    }
  }

  function handleAddToCart() {
    addItem({
      productId: activeVariant.variantId,
      productTitle: buildCartTitle(group.title, activeVariant),
      price: activeVariant.price_cents,
      imageUrl: activeVariant.hero ?? activeVariant.mock1 ?? null,
    })
    setAdded(true)
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  const orientation = group.orientation ?? 'landscape'

  return (
    <div className={noPadding ? '' : 'pt-24 px-6 md:px-12 pb-20'}>
      {/* Breadcrumb */}
      <Breadcrumb
        segments={[
          { label: 'Shop', href: '/shop' },
          { label: collectionName, href: `/shop/${collectionSlug}` },
          { label: group.title },
        ]}
      />

      <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-20 mt-10">
        {/* Title + price — mobile: 1st. Desktop: right col top */}
        <div className="order-1 md:order-none md:col-start-2 md:row-start-1 mb-6 md:mb-0">
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">
            {group.title}
          </h1>
          <p className="text-2xl text-ink mb-6">{price}</p>
        </div>

        {/* Gallery — mobile: 2nd. Desktop: left col, both rows */}
        <div className="order-2 md:order-none md:col-start-1 md:row-start-1 md:row-span-2 mb-8 md:mb-0">
          <ProductGallery
            images={galleryImages}
            productTitle={group.title}
            orientation={orientation}
          />
        </div>

        {/* Pickers + add-to-cart + description — mobile: 3rd. Desktop: right col bottom */}
        <div className="order-3 md:order-none md:col-start-2 md:row-start-2 flex flex-col">
          {/* Size picker */}
          {sizes.length > 1 && (
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase text-muted mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(({ size, label }) => (
                  <PickerButton
                    key={size}
                    label={label}
                    active={selectedSize === size}
                    onClick={() => handleSizeChange(size)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color picker (fap only) */}
          {hasColor && colors.length > 1 && (
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase text-muted mb-3">Frame</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <PickerButton
                    key={color}
                    label={colorLabel(color)}
                    active={selectedColor === color}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pack tier picker (gre/pos) */}
          {hasPack && packs.length > 1 && (
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase text-muted mb-3">Pack</p>
              <div className="flex flex-wrap gap-2">
                {packs.map((pack) => (
                  <PickerButton
                    key={pack}
                    label={`${pack}-pack`}
                    active={selectedPack === pack}
                    onClick={() => setSelectedPack(pack)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!group.available}
              className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {added
                ? 'Added to cart ✓'
                : group.available
                ? `Add to Cart — ${price}`
                : 'Currently unavailable'}
            </button>
          </div>

          {/* Mockup disclosure */}
          <p className="text-sm text-muted leading-relaxed mb-8">
            <em>Mockup shown for illustration; actual product may vary slightly. See product reference image in the gallery for accurate appearance.</em>
          </p>

          {/* Description */}
          {group.description && (
            <div className="border-t border-dust/30 pt-8">
              <p className="text-xs tracking-widest uppercase text-muted mb-4">Details</p>
              <p className="text-sm text-muted leading-relaxed">{group.description}</p>
            </div>
          )}

          {/* Print note */}
          <div className="border-t border-dust/30 mt-8 pt-6">
            <p className="text-xs text-muted leading-relaxed">
              Printed on archival paper. Delivery 5–10 business days.
              Ships from the nearest fulfilment partner to your address.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildCartTitle(groupTitle: string, variant: ProductVariant): string {
  const parts: string[] = [groupTitle]
  const suffix: string[] = []
  if (variant.size_label) suffix.push(variant.size_label)
  if (variant.color) {
    const map: Record<string, string> = {
      black: 'Black Frame',
      'natural-oak': 'Natural Oak Frame',
      white: 'White Frame',
    }
    suffix.push(map[variant.color] ?? variant.color)
  }
  if (variant.pack) suffix.push(`${variant.pack}-pack`)
  if (suffix.length > 0) parts.push(suffix.join(', '))
  return parts.join(' — ')
}
