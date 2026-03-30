'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  getEnabledVariants,
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
  option,
  selectedValueId,
  availableValueIds,
  onChange,
}: {
  option: PrintifyProduct['options'][number]
  selectedValueId: number
  availableValueIds: Set<number>
  onChange: (valueId: number) => void
}) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-muted mb-2">{option.name}</p>
      <div className="flex flex-wrap gap-2">
        {option.values.filter((value) => availableValueIds.has(value.id)).map((value) => {
          const active = selectedValueId === value.id
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
  const enabledVariants = getEnabledVariants(product)

  // Build initial selection: default variant's option values
  const defaultVariant =
    enabledVariants.find((v) => v.is_default) ?? enabledVariants[0]

  const [selectedValues, setSelectedValues] = useState<number[]>(
    () => defaultVariant?.options ?? product.options.map((opt) => opt.values[0]?.id ?? 0)
  )
  const [showConfirm, setShowConfirm] = useState(false)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')

  // Derive the active variant from current selections
  const activeVariant: PrintifyVariant | null = useMemo(() => {
    return (
      enabledVariants.find((v) =>
        product.options.every((_, idx) => v.options[idx] === selectedValues[idx])
      ) ?? null
    )
  }, [enabledVariants, product.options, selectedValues])

  // For each option, which value IDs are still available given other selections
  function getAvailableValues(optionIdx: number): Set<number> {
    const otherSelections = selectedValues.filter((_, i) => i !== optionIdx)
    return new Set(
      enabledVariants
        .filter((v) =>
          product.options.every(
            (_, i) => i === optionIdx || v.options[i] === selectedValues[i]
          )
        )
        .map((v) => v.options[optionIdx])
    )
  }

  function handleOptionChange(optionIdx: number, valueId: number) {
    const next = [...selectedValues]
    next[optionIdx] = valueId
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

  const selectedLabels = product.options
    .map((opt, idx) => opt.values.find((v) => v.id === selectedValues[idx])?.title ?? '')
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
              {product.options.map((option, idx) => (
                <OptionSelector
                  key={option.name}
                  option={option}
                  selectedValueId={selectedValues[idx]}
                  availableValueIds={getAvailableValues(idx)}
                  onChange={(valueId) => handleOptionChange(idx, valueId)}
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
