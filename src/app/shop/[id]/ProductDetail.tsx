'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  formatPrice,
  type PrintifyProduct,
  type PrintifyVariant,
} from '@/lib/printify'
import { useCart } from '@/lib/cart'

// ─── Image gallery ────────────────────────────────────────────────────────────

function Gallery({
  images,
  activeVariantId,
}: {
  images: PrintifyProduct['images']
  activeVariantId: number | null
}) {
  // Prefer the image that belongs to the active variant; fall back to default
  const defaultIdx = useMemo(() => {
    if (activeVariantId !== null) {
      const variantIdx = images.findIndex((img) =>
        img.variant_ids.includes(activeVariantId)
      )
      if (variantIdx !== -1) return variantIdx
    }
    const defIdx = images.findIndex((img) => img.is_default)
    return defIdx !== -1 ? defIdx : 0
  }, [images, activeVariantId])

  const [selected, setSelected] = useState(0)

  // Sync to variant changes only when the variant-linked image is different
  const displayIdx = selected !== 0 ? selected : defaultIdx

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="aspect-square bg-dust/20 relative overflow-hidden">
        {images[displayIdx] ? (
          <Image
            src={images[displayIdx].src}
            alt="Product image"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-dust text-xs tracking-widest uppercase">No image</span>
          </div>
        )}
      </div>

      {/* Thumbnails — only shown when there are multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`w-16 h-16 relative overflow-hidden flex-shrink-0 border transition-colors ${
                displayIdx === idx ? 'border-ink' : 'border-dust/40 hover:border-dust'
              }`}
            >
              <Image
                src={img.src}
                alt={`View ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Option selector ──────────────────────────────────────────────────────────

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

  console.log('[ProductDetail] options[0]:', product.options[0]?.name, product.options[0]?.type)
  console.log('[ProductDetail] options[1]:', product.options[1]?.name, product.options[1]?.type)
  console.log('[ProductDetail] colorOptionIdx:', colorOptionIdx, '| sizeOptionIdx:', sizeOptionIdx)

  // Available values: only IDs that appear in at least one enabled variant
  const availableColorValues = colorOption
    ? Array.from(new Set(enabledVariants.map((v) => v.options[colorOptionIdx]))).map((id) => ({
        id,
        title: colorOption.values.find((v) => v.id === id)?.title ?? String(id),
      }))
    : []

  const availableSizeValues = sizeOption
    ? sortOptionValues(
        Array.from(new Set(enabledVariants.map((v) => v.options[sizeOptionIdx]))).map((id) => ({
          id,
          title: sizeOption.values.find((v) => v.id === id)?.title ?? String(id),
        })),
        sizeOption.name
      )
    : []

  const defaultVariant = enabledVariants.find((v) => v.is_default) ?? enabledVariants[0]

  const [selectedColorId, setSelectedColorId] = useState<number>(
    () => (defaultVariant && colorOptionIdx >= 0 ? defaultVariant.options[colorOptionIdx] : 0)
  )
  const [selectedSizeId, setSelectedSizeId] = useState<number>(
    () => (defaultVariant && sizeOptionIdx >= 0 ? defaultVariant.options[sizeOptionIdx] : 0)
  )
  const [added, setAdded] = useState(false)
  const { addItem, openDrawer } = useCart()

  const activeVariant: PrintifyVariant | null = useMemo(() => {
    return (
      enabledVariants.find((v) => {
        const colorMatch = colorOptionIdx < 0 || v.options[colorOptionIdx] === selectedColorId
        const sizeMatch = sizeOptionIdx < 0 || v.options[sizeOptionIdx] === selectedSizeId
        return colorMatch && sizeMatch
      }) ?? null
    )
  }, [enabledVariants, selectedColorId, selectedSizeId])

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

  return (
    <div className="pt-24 px-6 md:px-12 pb-20">
      {/* Back link */}
      <Link
        href="/shop"
        className="text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors inline-flex items-center gap-2 mb-10"
      >
        <span>←</span> Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <Gallery
          images={product.images}
          activeVariantId={activeVariant?.id ?? null}
        />

        {/* Info */}
        <div className="flex flex-col">
          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-4">
            {product.title}
          </h1>

          {/* Price */}
          <p className="text-2xl text-ink mb-8">
            {price ?? <span className="text-muted text-base">Select options</span>}
          </p>

          {/* Options */}
          {(colorOption || sizeOption) && (
            <div className="flex flex-col gap-6 mb-8">
              {colorOption && (
                <OptionSelector
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
          )}

          {/* Add to cart */}
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
              <p className="text-xs text-muted text-center">
                This combination is unavailable
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-dust/30 pt-8">
              <p className="text-xs tracking-widest uppercase text-muted mb-4">
                Details
              </p>
              <div
                className="text-sm text-muted leading-relaxed prose-sm"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Print note */}
          <div className="border-t border-dust/30 mt-8 pt-6">
            <p className="text-xs text-dust leading-relaxed">
              Printed on demand via Printify. Delivery 5–10 business days.
              Ships from the nearest fulfilment partner to your address.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
