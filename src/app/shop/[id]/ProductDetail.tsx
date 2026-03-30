'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  formatPrice,
  type PrintifyProduct,
  type PrintifyVariant,
} from '@/lib/printify'

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

  // For each product.options[i], detect which slot in variant.options[] holds its values.
  // Printify's variant options order may differ from product.options order.
  const productToVariantPos: number[] = product.options.map((opt) => {
    if (enabledVariants.length === 0) return -1
    const sample = enabledVariants[0]
    return sample.options.findIndex((vid) => opt.values.some((v) => v.id === vid))
  })

  // Display order: color first, size second, others after
  const displayOptionOrder = Array.from(product.options.keys()).sort((a, b) => {
    const rank = (name: string) =>
      /colou?r/i.test(name) ? 0 : /size/i.test(name) ? 1 : 2
    return rank(product.options[a].name) - rank(product.options[b].name)
  })

  const defaultVariant = enabledVariants.find((v) => v.is_default) ?? enabledVariants[0]

  const [selectedValues, setSelectedValues] = useState<number[]>(() => {
    if (!defaultVariant) return product.options.map((opt) => opt.values[0]?.id ?? 0)
    return product.options.map((_, pIdx) => {
      const vPos = productToVariantPos[pIdx]
      return vPos >= 0 ? defaultVariant.options[vPos] : 0
    })
  })
  const [showConfirm, setShowConfirm] = useState(false)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')

  // Match selected values to an exact enabled variant using detected position mapping
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

  // Derive available {id, title} values for product option pIdx given other selections
  function getAvailableOptionValues(pIdx: number): { id: number; title: string }[] {
    const vPos = productToVariantPos[pIdx]
    if (vPos < 0) return []
    const ids = new Set(
      enabledVariants
        .filter((v) =>
          product.options.every((_, i) => {
            if (i === pIdx) return true
            const vi = productToVariantPos[i]
            return vi < 0 || v.options[vi] === selectedValues[i]
          })
        )
        .map((v) => v.options[vPos])
    )
    return Array.from(ids).map((id) => ({
      id,
      title: titleMap.get(id) ?? String(id),
    }))
  }

  function handleOptionChange(pIdx: number, valueId: number) {
    const next = [...selectedValues]
    next[pIdx] = valueId
    setSelectedValues(next)
  }

  async function handleConfirmPay() {
    if (!activeVariant) return
    setBuying(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: activeVariant.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setBuying(false)
    }
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
          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs tracking-[0.2em] uppercase text-dust"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

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
                  values={getAvailableOptionValues(pIdx)}
                  selectedId={selectedValues[pIdx]}
                  onChange={(valueId) => handleOptionChange(pIdx, valueId)}
                />
              ))}
            </div>
          )}

          {/* Buy button / confirmation */}
          <div className="flex flex-col gap-3 mb-8">
            {showConfirm ? (
              <div className="border border-dust/40 p-5 flex flex-col gap-4">
                <p className="text-xs tracking-widest uppercase text-muted">Order summary</p>
                <div>
                  <p className="text-sm text-ink font-medium">{product.title}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {selectedLabels} · {price}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmPay}
                    disabled={buying}
                    className="btn-primary flex-1 text-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {buying ? 'Redirecting…' : 'Confirm & Pay →'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={buying}
                    className="px-4 py-2 text-xs tracking-wider uppercase border border-dust text-ink hover:border-ink transition-colors disabled:opacity-40"
                  >
                    ← Change
                  </button>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!activeVariant}
                  className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {activeVariant
                    ? `Buy Now — ${selectedLabels} — ${price}`
                    : 'Select options'}
                </button>
                {!activeVariant && (
                  <p className="text-xs text-muted text-center">
                    This combination is unavailable
                  </p>
                )}
              </>
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
