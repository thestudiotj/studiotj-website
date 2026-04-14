'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  formatPrice,
  type PrintifyProduct,
  type PrintifyVariant,
} from '@/lib/printify'
import { useCart } from '@/lib/cart'
import ProductGallery from '@/components/ProductGallery'

// ─── Color swatch selector ────────────────────────────────────────────────────

// Maps common color names to approximate hex values for swatches.
// Falls back to rendering a text button for unrecognised colors.
const COLOR_HEX: Record<string, string> = {
  black: '#0D0D0D',
  white: '#F5F2EC',
  navy: '#1B2A4A',
  'navy blue': '#1B2A4A',
  blue: '#2563EB',
  'light blue': '#93C5FD',
  'sky blue': '#7DD3FC',
  red: '#DC2626',
  green: '#16A34A',
  'forest green': '#166534',
  yellow: '#EAB308',
  orange: '#EA580C',
  pink: '#EC4899',
  purple: '#7C3AED',
  grey: '#6B7280',
  gray: '#6B7280',
  'dark grey': '#374151',
  'dark gray': '#374151',
  'light grey': '#D1D5DB',
  'light gray': '#D1D5DB',
  brown: '#92400E',
  tan: '#D97706',
  beige: '#E7D5B3',
  cream: '#FEF3C7',
  maroon: '#7F1D1D',
  burgundy: '#6B21A8',
  teal: '#0D9488',
  cyan: '#06B6D4',
  gold: '#D97706',
  silver: '#9CA3AF',
  charcoal: '#374151',
  'heather grey': '#9CA3AF',
  'heather gray': '#9CA3AF',
}

function getSwatchHex(title: string): string | null {
  return COLOR_HEX[title.toLowerCase()] ?? null
}

function ColorSwatchSelector({
  label,
  values,
  selectedId,
  onChange,
}: {
  label: string
  values: { id: number; title: string }[]
  selectedId: number
  onChange: (id: number) => void
}) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const active = selectedId === value.id
          const hex = getSwatchHex(value.title)
          const isLight =
            hex === COLOR_HEX.white || hex === COLOR_HEX.cream || hex === COLOR_HEX.beige

          if (hex) {
            return (
              <button
                key={value.id}
                onClick={() => onChange(value.id)}
                title={value.title}
                className={`w-7 h-7 rounded-full transition-all duration-150 ${
                  active
                    ? isLight
                      ? 'ring-2 ring-offset-2 ring-ink'
                      : 'ring-2 ring-offset-2 ring-ink'
                    : 'hover:scale-110'
                }`}
                style={{ background: hex, border: isLight ? '1px solid #C4BEB4' : 'none' }}
                aria-label={value.title}
                aria-pressed={active}
              />
            )
          }

          // Fallback: text button for unrecognised colors
          return (
            <button
              key={value.id}
              onClick={() => onChange(value.id)}
              className={`px-4 py-2 text-xs tracking-wider uppercase border transition-colors ${
                active
                  ? 'bg-ink text-paper border-ink'
                  : 'border-dust text-ink hover:border-ink'
              }`}
            >
              {value.title}
            </button>
          )
        })}
      </div>
      {/* Show selected color name beneath swatches */}
      <p className="text-xs text-muted mt-2">
        {values.find((v) => v.id === selectedId)?.title ?? ''}
      </p>
    </div>
  )
}

// ─── Generic option selector (sizes, etc.) ────────────────────────────────────

function OptionSelector({
  label,
  values,
  selectedId,
  onChange,
}: {
  label: string
  values: { id: number; title: string }[]
  selectedId: number
  onChange: (id: number) => void
}) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const active = selectedId === value.id
          return (
            <button
              key={value.id}
              onClick={() => onChange(value.id)}
              className={`px-4 py-2 text-xs tracking-wider uppercase border transition-colors ${
                active
                  ? 'bg-ink text-paper border-ink'
                  : 'border-dust text-ink hover:border-ink'
              }`}
            >
              {value.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Size sort ────────────────────────────────────────────────────────────────

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL']

function sortOptionValues(
  values: { id: number; title: string }[],
  optionName: string
): { id: number; title: string }[] {
  if (!/size/i.test(optionName)) return values
  return [...values].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.title.toUpperCase())
    const bi = SIZE_ORDER.indexOf(b.title.toUpperCase())
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return -1
    if (bi >= 0) return 1
    const an = parseFloat(a.title)
    const bn = parseFloat(b.title)
    if (!isNaN(an) && !isNaN(bn)) return an - bn
    return a.title.localeCompare(b.title)
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductDetail({ product }: { product: PrintifyProduct }) {
  const enabledVariants = product.variants.filter((v) => v.is_enabled)

  // Locate color and size options by type or name
  const colorOptionIdx = product.options.findIndex(
    (o) => o.type === 'color' || o.name.toLowerCase().includes('color')
  )
  const sizeOptionIdx = product.options.findIndex(
    (o) => o.type === 'size' || o.name.toLowerCase().includes('size')
  )
  const colorOption = colorOptionIdx >= 0 ? product.options[colorOptionIdx] : null
  const sizeOption = sizeOptionIdx >= 0 ? product.options[sizeOptionIdx] : null

  // Build a map from value ID → option index (position-independent)
  const valueIdToOptionIdx = new Map<number, number>()
  product.options.forEach((opt, i) => {
    opt.values.forEach((val) => valueIdToOptionIdx.set(val.id, i))
  })

  const availableColorValues = colorOption
    ? Array.from(
        new Set(
          enabledVariants.flatMap((v) =>
            v.options.filter((id) => valueIdToOptionIdx.get(id) === colorOptionIdx)
          )
        )
      ).map((id) => ({
        id,
        title: colorOption.values.find((v) => v.id === id)?.title ?? String(id),
      }))
    : []

  const availableSizeValues = sizeOption
    ? sortOptionValues(
        Array.from(
          new Set(
            enabledVariants.flatMap((v) =>
              v.options.filter((id) => valueIdToOptionIdx.get(id) === sizeOptionIdx)
            )
          )
        ).map((id) => ({
          id,
          title: sizeOption.values.find((v) => v.id === id)?.title ?? String(id),
        })),
        sizeOption.name
      )
    : []

  const defaultVariant = enabledVariants.find((v) => v.is_default) ?? enabledVariants[0]

  // Default to Black if available, otherwise fall back to the default variant
  const [selectedColorId, setSelectedColorId] = useState<number>(() => {
    if (colorOptionIdx < 0) return 0
    const blackValue = availableColorValues.find((v) => /\bblack\b/i.test(v.title))
    if (blackValue) return blackValue.id
    return defaultVariant && colorOptionIdx >= 0
      ? defaultVariant.options[colorOptionIdx]
      : (availableColorValues[0]?.id ?? 0)
  })

  const [selectedSizeId, setSelectedSizeId] = useState<number>(
    () => (defaultVariant && sizeOptionIdx >= 0 ? defaultVariant.options[sizeOptionIdx] : 0)
  )
  const [added, setAdded] = useState(false)
  const { addItem, openDrawer } = useCart()

  const activeVariant: PrintifyVariant | null = useMemo(() => {
    return (
      enabledVariants.find((v) => {
        const colorMatch = colorOptionIdx < 0 || v.options.includes(selectedColorId)
        const sizeMatch = sizeOptionIdx < 0 || v.options.includes(selectedSizeId)
        return colorMatch && sizeMatch
      }) ?? null
    )
  }, [enabledVariants, selectedColorId, selectedSizeId, colorOptionIdx, sizeOptionIdx])

  // All variant IDs for the selected color (used to filter gallery images)
  const colorVariantIds = useMemo(() => {
    if (!selectedColorId) return []
    return enabledVariants
      .filter((v) => v.options.includes(selectedColorId))
      .map((v) => v.id)
  }, [enabledVariants, selectedColorId])

  function handleAddToCart() {
    if (!activeVariant) return
    const image =
      product.images.find((img) => img.variant_ids.includes(activeVariant.id)) ??
      product.images.find((img) => img.is_default) ??
      product.images[0] ??
      null
    const colorTitle = colorOption?.values.find((v) => v.id === selectedColorId)?.title ?? ''
    const sizeTitle = sizeOption?.values.find((v) => v.id === selectedSizeId)?.title ?? ''
    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      productTitle: product.title,
      variantLabel: [colorTitle, sizeTitle].filter(Boolean).join(' / '),
      price: activeVariant.price,
      imageUrl: image?.src ?? null,
    })
    setAdded(true)
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  const price = activeVariant ? formatPrice(activeVariant.price) : null
  const colorTitle = colorOption?.values.find((v) => v.id === selectedColorId)?.title ?? ''
  const sizeTitle = sizeOption?.values.find((v) => v.id === selectedSizeId)?.title ?? ''
  const selectedLabels = [colorTitle, sizeTitle].filter(Boolean).join(' / ')

  const gallery = (
    <ProductGallery
      images={product.images}
      colorVariantIds={colorVariantIds}
      productTitle={product.title}
    />
  )

  const titleAndPrice = (
    <>
      <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">
        {product.title}
      </h1>
      <p className="text-2xl text-ink mb-6">
        {price ?? <span className="text-muted text-base">Select options</span>}
      </p>
    </>
  )

  const options = (colorOption || sizeOption) && (
    <div className="flex flex-col gap-6 mb-6">
      {colorOption && (
        <ColorSwatchSelector
          label={colorOption.name}
          values={availableColorValues}
          selectedId={selectedColorId}
          onChange={setSelectedColorId}
        />
      )}
      {sizeOption && (
        <OptionSelector
          label={sizeOption.name}
          values={availableSizeValues}
          selectedId={selectedSizeId}
          onChange={setSelectedSizeId}
        />
      )}
    </div>
  )

  const addToCart = (
    <div className="flex flex-col gap-3 mb-8">
      <button
        onClick={handleAddToCart}
        disabled={!activeVariant}
        className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {added
          ? 'Added to cart ✓'
          : activeVariant
          ? `Add to Cart — ${selectedLabels} — ${price}`
          : 'Select options'}
      </button>
      {!activeVariant && (
        <p className="text-xs text-muted text-center">This combination is unavailable</p>
      )}
    </div>
  )

  const description = product.description && (
    <div className="border-t border-dust/30 pt-8">
      <p className="text-xs tracking-widest uppercase text-muted mb-4">Details</p>
      <div
        className="text-sm text-muted leading-relaxed prose-sm"
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    </div>
  )

  const printNote = (
    <div className="border-t border-dust/30 mt-8 pt-6">
      <p className="text-xs text-muted leading-relaxed">
        Printed on demand via Printify. Delivery 5–10 business days.
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
        - Mobile (flex-col): title/price → options → gallery → add-to-cart → description
        - Desktop (grid 2-col): gallery left (spanning both rows), info right
      */}
      <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-20">
        {/* Title + price — mobile: 1st. Desktop: right col top */}
        <div className="order-1 md:order-none md:col-start-2 md:row-start-1 mb-6 md:mb-0">
          {titleAndPrice}
          {options}
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
