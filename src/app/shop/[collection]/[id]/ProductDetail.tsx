'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import type { DisplayGroup, ProductVariant, MergedGroup } from '@/lib/catalogue'
import { isMergedGroup } from '@/lib/catalogue/types'
import { FAMILY_CONFIG } from '@/lib/catalogue/families'
import { getLearnTeaser } from '@/lib/catalogue/learn-teasers'
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

/** Lookup table for paper / print-type labels by source family code. Falls back
 *  to the FAMILY_CONFIG entries so this stays in sync with the rest of the UI. */
const FAMILY_CODE_LABELS: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const fam of FAMILY_CONFIG) {
    for (const opt of fam.variantOptions) out[opt.value] = opt.label
  }
  return out
})()

function familyCodeLabel(code: string): string {
  return FAMILY_CODE_LABELS[code] ?? code.toUpperCase()
}

const FAMILY_SHORT_LABELS: Record<string, string> = {
  'wall-art':         'Wall art',
  'prints-posters':   'Prints',
  'cards-stationery': 'Cards',
}

function familyShortLabelForGroup(group: DisplayGroup): string | null {
  const codes = isMergedGroup(group) ? group.source_family_codes : [group.family]
  const fam = FAMILY_CONFIG.find((f) => f.familyCodes.some((c) => codes.includes(c)))
  return fam ? FAMILY_SHORT_LABELS[fam.slug] ?? null : null
}

/** UI title for the source-family picker on a merged product page. */
function pickerLabelForMerge(merge: MergedGroup['merge_family']): string {
  return merge === 'paper-prints' ? 'Paper' : 'Print type'
}

function cheapestVariant(variants: ProductVariant[]): ProductVariant {
  return variants.reduce((cheapest, v) => (v.price_cents < cheapest.price_cents ? v : cheapest), variants[0])
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
  group: DisplayGroup
  collectionSlug: string
  collectionName: string
  noPadding?: boolean
}) {
  const merged = isMergedGroup(group)
  const defaultVariant = cheapestVariant(group.variants)

  // Source family is tracked only for merged groups; standalone groups have a single family.
  const defaultFamily = merged
    ? (defaultVariant as ProductVariant & { source_family?: string }).source_family ?? group.sources[0].family
    : group.family

  const [selectedFamily, setSelectedFamily] = useState(defaultFamily)
  const [selectedSize, setSelectedSize] = useState(defaultVariant.size)
  const [selectedColor, setSelectedColor] = useState(defaultVariant.color ?? '')
  const [selectedPack, setSelectedPack] = useState(defaultVariant.pack ?? 0)
  const [added, setAdded] = useState(false)

  const { addItem, openDrawer } = useCart()

  /** Variants restricted to the currently selected source family. For standalone
   *  groups this is just `group.variants`. */
  const familyVariants = useMemo<ProductVariant[]>(() => {
    if (!merged) return group.variants
    return group.variants.filter(
      (v) => (v as ProductVariant & { source_family?: string }).source_family === selectedFamily,
    )
  }, [group, merged, selectedFamily])

  // Whether axes are present is decided by the variant set: a merged paper-prints
  // group only has size, but a merged wall-art group has fap with color and can without.
  const hasColor = familyVariants.some((v) => v.color)
  const hasPack = familyVariants.some((v) => v.pack != null)

  const familyOptions = useMemo(() => {
    if (!merged) return []
    return group.source_family_codes.map((code) => ({
      value: code,
      label: familyCodeLabel(code),
      minPrice: Math.min(
        ...group.variants
          .filter((v) => (v as ProductVariant & { source_family?: string }).source_family === code)
          .map((v) => v.price_cents),
      ),
    }))
  }, [group, merged])

  const sizes = useMemo(() => {
    const seen = new Set<string>()
    return familyVariants
      .filter((v) => {
        if (seen.has(v.size)) return false
        seen.add(v.size)
        return true
      })
      .map((v) => ({ size: v.size, label: v.size_label }))
  }, [familyVariants])

  const colors = useMemo(() => {
    if (!hasColor) return []
    const seen = new Set<string>()
    return familyVariants
      .filter((v) => v.size === selectedSize && v.color && !seen.has(v.color) && seen.add(v.color!))
      .map((v) => v.color!)
  }, [familyVariants, selectedSize, hasColor])

  const packs = useMemo(() => {
    if (!hasPack) return []
    const seen = new Set<number>()
    return familyVariants
      .filter((v) => v.size === selectedSize && v.pack != null && !seen.has(v.pack!) && seen.add(v.pack!))
      .map((v) => v.pack!)
  }, [familyVariants, selectedSize, hasPack])

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    return familyVariants.find((v) => {
      if (v.size !== selectedSize) return false
      if (hasColor && v.color !== selectedColor) return false
      if (hasPack && v.pack !== selectedPack) return false
      return true
    })
  }, [familyVariants, selectedSize, selectedColor, selectedPack, hasColor, hasPack])

  const activeVariant = selectedVariant ?? cheapestVariant(familyVariants)
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
      const firstColorForSize = familyVariants.find((v) => v.size === size)?.color ?? ''
      setSelectedColor(firstColorForSize)
    }
    if (hasPack) {
      const firstPackForSize = familyVariants.find((v) => v.size === size)?.pack ?? 0
      setSelectedPack(firstPackForSize)
    }
  }

  function handleFamilyChange(code: string) {
    setSelectedFamily(code)
    // Source family changed: pick the cheapest variant in the new family that
    // matches the current size; if no match, fall back to that family's cheapest.
    const newFamilyVariants = group.variants.filter(
      (v) => (v as ProductVariant & { source_family?: string }).source_family === code,
    )
    const sameSize = newFamilyVariants.find((v) => v.size === selectedSize)
    const target = sameSize ?? cheapestVariant(newFamilyVariants)
    setSelectedSize(target.size)
    setSelectedColor(target.color ?? '')
    setSelectedPack(target.pack ?? 0)
  }

  function handleAddToCart() {
    const variantFamily = merged
      ? (activeVariant as ProductVariant & { source_family?: string }).source_family
      : undefined
    addItem({
      productId: activeVariant.variantId,
      productTitle: buildCartTitle(group.title, activeVariant, variantFamily),
      price: activeVariant.price_cents,
      imageUrl: activeVariant.hero ?? activeVariant.mock1 ?? null,
    })
    setAdded(true)
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  const orientation = group.orientation ?? 'landscape'

  // Substrate teaser bound to the currently selected source family. For standalone
  // groups `selectedFamily` equals `group.family` and never changes; for merged
  // groups it tracks the user's paper / print-type pick. Returns null for any
  // family without a registered explainer page (book, calendar, ...).
  const learnTeaser = getLearnTeaser(selectedFamily)

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
          {familyShortLabelForGroup(group) && (
            <span className="inline-block text-[10px] tracking-wider uppercase px-2 py-0.5 bg-dust/25 text-muted rounded-sm mb-3">
              {familyShortLabelForGroup(group)}
            </span>
          )}
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
          {/* Paper / Print-type picker — merged groups only */}
          {merged && familyOptions.length > 1 && (
            <div className="mb-6">
              <p className="text-xs tracking-widest uppercase text-muted mb-3">
                {pickerLabelForMerge(group.merge_family)}
              </p>
              <div className="flex flex-wrap gap-2">
                {familyOptions.map((opt) => (
                  <PickerButton
                    key={opt.value}
                    label={opt.label}
                    active={selectedFamily === opt.value}
                    onClick={() => handleFamilyChange(opt.value)}
                  />
                ))}
              </div>
            </div>
          )}

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

          {/* Substrate teaser — explains the selected paper / print-type / format */}
          {learnTeaser && (
            <div className="border-t border-dust/30 pt-8 mb-8">
              <p className="text-xs tracking-widest uppercase text-muted mb-4">{learnTeaser.displayName}</p>
              <p className="text-sm text-muted leading-relaxed mb-4">{learnTeaser.teaser}</p>
              <Link
                href={`/shop/learn/${learnTeaser.family}`}
                className="text-sm tracking-wide text-[var(--accent)] hover:underline"
              >
                Read more →
              </Link>
            </div>
          )}

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

function buildCartTitle(
  groupTitle: string,
  variant: ProductVariant,
  sourceFamilyCode: string | undefined,
): string {
  const parts: string[] = [groupTitle]
  const suffix: string[] = []
  // For merged groups the paper / print-type isn't in the title, so add it here
  // so the cart line item identifies exactly what was ordered.
  if (sourceFamilyCode) {
    const label = FAMILY_CODE_LABELS[sourceFamilyCode]
    if (label) suffix.push(label)
  }
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
