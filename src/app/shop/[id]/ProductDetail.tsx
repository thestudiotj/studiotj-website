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
  // is_enabled = shop owner has configured this variant for sale
  const enabledVariants = product.variants.filter((v) => v.is_enabled)
  console.log('[ProductDetail] options:', JSON.stringify(product.options, null, 2))
  console.log('[ProductDetail] variants (first 3):', JSON.stringify(product.variants.slice(0, 3), null, 2))
  console.log('[ProductDetail] enabledVariants count:', enabledVariants.length)

  // Single valueId → title map across all option definitions
  const titleMap = new Map<number, string>()
  for (const opt of product.options) {
    for (const val of opt.values) titleMap.set(val.id, val.title)
  }

  // Collect which IDs appear at each variant.options position across enabled variants.
  // variant.options order may differ from product.options order, so we detect the mapping
  // using only IDs that actually appear in this product's variants (small, non-overlapping sets).
  const variantPositionSets: Set<number>[] = []
  for (const v of enabledVariants) {
    v.options.forEach((id, pos) => {
      if (!variantPositionSets[pos]) variantPositionSets[pos] = new Set()
      variantPositionSets[pos].add(id)
    })
  }

  // For each product option, find which variant.options position holds its values
  const productToVariantPos: number[] = product.options.map((opt) => {
    const optIds = new Set(opt.values.map((v) => v.id))
    for (let pos = 0; pos < variantPositionSets.length; pos++) {
      const posSet = variantPositionSets[pos]
      if (posSet && [...posSet].some((id) => optIds.has(id))) return pos
    }
    return -1
  })

  // Display order: color first, size second, others after
  const displayOptionOrder = Array.from(product.options.keys()).sort((a, b) => {
    const rank = (type: string) => (type === 'color' ? 0 : type === 'size' ? 1 : 2)
    return rank(product.options[a].type) - rank(product.options[b].type)
  })

  const defaultVariant = enabledVariants.find((v) => v.is_default) ?? enabledVariants[0]

  const [selectedValues, setSelectedValues] = useState<number[]>(() => {
    if (!defaultVariant) return product.options.map((opt) => opt.values[0]?.id ?? 0)
    return product.options.map((_, pIdx) => {
      const vPos = productToVariantPos[pIdx]
      return vPos >= 0 ? defaultVariant.options[vPos] : 0
    })
  })
  const [added, setAdded] = useState(false)
  const { addItem, openDrawer } = useCart()

  // Match selected values to an exact enabled variant
  const activeVariant: PrintifyVariant | null = useMemo(() => {
    return (
      enabledVariants.find((v) =>
        product.options.every((_, pIdx) => {
          const vPos = productToVariantPos[pIdx]
          return vPos < 0 || v.options[vPos] === selectedValues[pIdx]
        })
      ) ?? null
    )
  }, [enabledVariants, product.options, selectedValues])

  // For each option, pre-compute the values that appear in at least one enabled variant
  const availableValuesByOption = product.options.map((opt, pIdx) => {
    const vPos = productToVariantPos[pIdx]
    if (vPos < 0) return []
    const ids = new Set(enabledVariants.map((v) => v.options[vPos]))
    const values = Array.from(ids).map((id) => ({
      id,
      title: titleMap.get(id) ?? String(id),
    }))
    return sortOptionValues(values, opt.name)
  })

  function handleOptionChange(pIdx: number, valueId: number) {
    const next = [...selectedValues]
    next[pIdx] = valueId
    setSelectedValues(next)
  }

  function handleAddToCart() {
    if (!activeVariant) return
    const image = product.images.find((img) => img.variant_ids.includes(activeVariant.id))
      ?? product.images.find((img) => img.is_default)
      ?? product.images[0]
      ?? null
    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      productTitle: product.title,
      variantLabel: selectedLabels,
      price: activeVariant.price,
      imageUrl: image?.src ?? null,
    })
    setAdded(true)
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  const price = activeVariant ? formatPrice(activeVariant.price) : null

  const selectedLabels = selectedValues
    .map((id) => titleMap.get(id) ?? '')
    .filter(Boolean)
    .join(' / ')

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
          {product.options.length > 0 && (
            <div className="flex flex-col gap-6 mb-8">
              {displayOptionOrder.map((pIdx) => (
                <OptionSelector
                  key={product.options[pIdx].name}
                  label={product.options[pIdx].name}
                  values={availableValuesByOption[pIdx]}
                  selectedId={selectedValues[pIdx]}
                  onChange={(valueId) => handleOptionChange(pIdx, valueId)}
                />
              ))}
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
