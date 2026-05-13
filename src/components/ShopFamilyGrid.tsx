'use client'

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { DisplayGroup } from '@/lib/catalogue/types'
import { isMergedGroup } from '@/lib/catalogue/types'
import type { FamilyMeta } from '@/lib/catalogue/families'
import { COLLECTION_CONFIG } from '@/lib/catalogue/collections'
import { COLLECTION_TO_SLUG } from '@/lib/catalogue/collections'

const COLLECTION_LABELS: Record<string, string> = {
  'the-atmospheric-collection': 'Atmospheric',
  'the-halcyon-collection': 'Halcyon',
  'monochrome-moods': 'Mono',
  'the-signature-collection': 'Signature',
}

/** Family slugs whose products are merged at runtime — the per-paper/per-type
 *  variant dropdown is meaningless on these pages and is hidden. */
const MERGED_FAMILY_SLUGS = new Set(['prints-posters', 'wall-art'])

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function groupMinPriceCents(group: DisplayGroup): number {
  return Math.min(...group.variants.map((v) => v.price_cents))
}

function groupDefaultVariant(group: DisplayGroup) {
  if (isMergedGroup(group)) {
    return group.variants.reduce(
      (cheapest, v) => (v.price_cents < cheapest.price_cents ? v : cheapest),
      group.variants[0],
    )
  }
  const idx = Math.min(group.default_variant, group.variants.length - 1)
  return group.variants[idx]
}

function groupFamilyCodes(group: DisplayGroup): string[] {
  return isMergedGroup(group) ? group.source_family_codes : [group.family]
}

// ─── Collection pill ──────────────────────────────────────────────────────────

function CollectionPill({ collection }: { collection: string }) {
  const label = COLLECTION_LABELS[collection]
  if (!label) return null
  return (
    <span className="inline-block text-[10px] tracking-wider uppercase px-2 py-0.5 bg-dust/25 text-muted rounded-sm">
      {label}
    </span>
  )
}

// ─── Product card with collection pill ───────────────────────────────────────

function FamilyProductCard({ group }: { group: DisplayGroup }) {
  const minPrice = groupMinPriceCents(group)
  const defaultVariant = groupDefaultVariant(group)
  const heroImage = defaultVariant.hero ?? defaultVariant.mock1 ?? null
  const hasMultipleVariants = group.variants.length > 1
  const collectionSlug = COLLECTION_TO_SLUG[group.collection] ?? group.collection

  return (
    <Link href={`/shop/${collectionSlug}/${group.id}`} className="group">
      <div className="aspect-square bg-dust/20 relative overflow-hidden mb-3">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={group.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted text-xs tracking-widest uppercase">No image</span>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <CollectionPill collection={group.collection} />
        <h3 className="text-sm font-medium text-ink leading-snug">{group.title}</h3>
        <p className="text-muted text-sm">
          {hasMultipleVariants ? 'from ' : ''}{formatPrice(minPrice)}
        </p>
      </div>
    </Link>
  )
}

// ─── Variant dropdown ─────────────────────────────────────────────────────────

function VariantDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-dust/60 text-ink hover:border-ink transition-colors bg-paper"
        aria-expanded={open}
      >
        <span className="text-xs tracking-widest uppercase text-muted mr-1">{label}:</span>
        <span>{selected ? selected.label : 'All'}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="currentColor"
          className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full left-0 mt-1 z-20 bg-paper border border-dust/60 shadow-sm min-w-[200px]">
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-dust/20 ${value === null ? 'font-medium text-ink' : 'text-muted'}`}
            >
              All
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-dust/20 ${value === opt.value ? 'font-medium text-ink' : 'text-muted'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Inner grid (uses useSearchParams) ────────────────────────────────────────

function FamilyGridInner({
  products,
  familyMeta,
}: {
  products: DisplayGroup[]
  familyMeta: FamilyMeta
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isMergedFamily = MERGED_FAMILY_SLUGS.has(familyMeta.slug)
  const activeCollection = searchParams.get('collection')
  const activeVariant = isMergedFamily ? null : searchParams.get('variant')

  function updateFilter(col: string | null, variant: string | null) {
    const params = new URLSearchParams()
    if (col) params.set('collection', col)
    if (variant && !isMergedFamily) params.set('variant', variant)
    const search = params.toString()
    router.replace(`${pathname}${search ? `?${search}` : ''}`, { scroll: false })
  }

  const filtered = useMemo(() => {
    let result = products
    if (activeCollection) {
      const col = COLLECTION_CONFIG.find((c) => c.slug === activeCollection)
      if (col) result = result.filter((g) => g.collection === col.key)
    }
    if (activeVariant) {
      result = result.filter((g) => groupFamilyCodes(g).includes(activeVariant))
    }
    return result
  }, [products, activeCollection, activeVariant])

  const hasActiveFilter = !!activeCollection || !!activeVariant
  const nothingAvailable = products.length === 0

  if (nothingAvailable) {
    return (
      <div className="flex flex-col items-center text-center max-w-xl mx-auto py-20">
        <h2 className="font-display text-3xl mb-4">Coming soon</h2>
        <p className="text-muted leading-relaxed">
          Products in this category will appear here when they&apos;re ready.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Collection chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => updateFilter(null, activeVariant)}
          className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-colors ${
            activeCollection === null
              ? 'bg-ink text-paper border-ink'
              : 'border-dust text-muted hover:border-ink hover:text-ink'
          }`}
        >
          All
        </button>
        {COLLECTION_CONFIG.map((col) => (
          <button
            key={col.slug}
            onClick={() => updateFilter(col.slug, activeVariant)}
            className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-colors ${
              activeCollection === col.slug
                ? 'bg-ink text-paper border-ink'
                : 'border-dust text-muted hover:border-ink hover:text-ink'
            }`}
          >
            {col.name}
          </button>
        ))}
      </div>

      {/* Variant dropdown — hidden for merged families (paper/print-type lives on the product page) */}
      <div className="flex items-center gap-4 mb-8">
        {!isMergedFamily && (
          <VariantDropdown
            label={familyMeta.variantDropdownLabel}
            options={familyMeta.variantOptions}
            value={activeVariant}
            onChange={(v) => updateFilter(activeCollection, v)}
          />
        )}
        {hasActiveFilter && (
          <button
            onClick={() => updateFilter(null, null)}
            className="text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs tracking-widest uppercase text-muted mb-8">
        {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
      </p>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="border border-dust/40 p-12 text-center max-w-sm">
          <p className="font-display text-xl text-ink mb-2">No products match these filters</p>
          <button
            onClick={() => updateFilter(null, null)}
            className="mt-4 text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {filtered.map((group) => (
            <FamilyProductCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Public export (wraps inner in Suspense for useSearchParams) ──────────────

export default function ShopFamilyGrid({
  products,
  familyMeta,
}: {
  products: DisplayGroup[]
  familyMeta: FamilyMeta
}) {
  return (
    <Suspense>
      <FamilyGridInner products={products} familyMeta={familyMeta} />
    </Suspense>
  )
}
