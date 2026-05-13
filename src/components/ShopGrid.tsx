'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { DisplayGroup, ProductVariant } from '@/lib/catalogue/types'
import { isMergedGroup } from '@/lib/catalogue/types'
import { COLLECTION_TO_SLUG, COLLECTION_CONFIG } from '@/lib/catalogue/collections'
import { FAMILY_CONFIG } from '@/lib/catalogue/families'
import {
  LOCATION_ORDER,
  locationLabel,
  extractLocation,
  extractShootDate,
} from '@/lib/catalogue/locations'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupMinPriceCents(group: DisplayGroup): number {
  return Math.min(...group.variants.map((v) => v.price_cents))
}

function groupDefaultVariant(group: DisplayGroup): ProductVariant {
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

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const COLLECTION_LABELS: Record<string, string> = {
  'the-signature-collection':    'Signature',
  'monochrome-moods':            'Monochrome',
  'the-atmospheric-collection':  'Atmospheric',
  'the-halcyon-collection':      'Halcyon',
}

const FAMILY_SHORT_LABELS: Record<string, string> = {
  'wall-art':         'Wall art',
  'prints-posters':   'Prints',
  'cards-stationery': 'Cards',
}

function groupFamilySlug(group: DisplayGroup): string | null {
  const codes = groupFamilyCodes(group)
  return FAMILY_CONFIG.find((f) => f.familyCodes.some((c) => codes.includes(c)))?.slug ?? null
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured'           },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'az',         label: 'A–Z'                },
  { value: 'location',   label: 'By Location'        },
] as const
type SortKey = (typeof SORT_OPTIONS)[number]['value']

function sortProducts(products: DisplayGroup[], sort: SortKey): DisplayGroup[] {
  const arr = [...products]
  const minP = (g: DisplayGroup) => Math.min(...g.variants.map((v) => v.price_cents))
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => minP(a) - minP(b))
    case 'price-desc':
      return arr.sort((a, b) => minP(b) - minP(a))
    case 'az':
      return arr.sort((a, b) => a.title.localeCompare(b.title))
    case 'location': {
      return arr.sort((a, b) => {
        const la = LOCATION_ORDER.indexOf(extractLocation(a.id) as (typeof LOCATION_ORDER)[number])
        const lb = LOCATION_ORDER.indexOf(extractLocation(b.id) as (typeof LOCATION_ORDER)[number])
        return (la < 0 ? 999 : la) - (lb < 0 ? 999 : lb)
      })
    }
    case 'featured':
    default:
      // Newest shoot first — date from photo_id prefix naturally interleaves locations
      return arr.sort((a, b) =>
        extractShootDate(b.photo_id).localeCompare(extractShootDate(a.photo_id))
      )
  }
}

// ─── Pill styles ──────────────────────────────────────────────────────────────

const pillBase = 'px-4 py-1.5 text-xs tracking-wider uppercase border transition-colors'
const pillActive = 'bg-ink text-paper border-ink'
const pillInactive = 'border-dust text-muted hover:border-ink hover:text-ink'

// ─── Shared dropdown ──────────────────────────────────────────────────────────

function FilterDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T | null) => void
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

// ─── Sort dropdown ────────────────────────────────────────────────────────────

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <FilterDropdown
      label="Sort"
      options={[...SORT_OPTIONS]}
      value={value}
      onChange={(v) => onChange(v ?? 'featured')}
    />
  )
}

// ─── Product cards ─────────────────────────────────────────────────────────────

function ProductCard({ group }: { group: DisplayGroup }) {
  const minPrice = groupMinPriceCents(group)
  const defaultVariant = groupDefaultVariant(group)
  const heroImage = defaultVariant.hero ?? defaultVariant.mock1 ?? null
  const hasMultipleVariants = group.variants.length > 1
  const href = `/shop/${COLLECTION_TO_SLUG[group.collection] ?? group.collection}/${group.id}`
  const familySlug = groupFamilySlug(group)
  const familyLabel = familySlug ? FAMILY_SHORT_LABELS[familySlug] ?? null : null

  return (
    <Link href={href} className="group">
      <div className="aspect-square bg-dust/20 relative overflow-hidden mb-4">
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
      {familyLabel && (
        <span className="inline-block text-[10px] tracking-wider uppercase px-2 py-0.5 bg-dust/25 text-muted rounded-sm mb-1.5">
          {familyLabel}
        </span>
      )}
      <h3 className="text-sm font-medium text-ink leading-snug">{group.title}</h3>
      <p className="text-muted text-sm mt-1">
        {hasMultipleVariants ? 'from ' : ''}{formatPrice(minPrice)}
      </p>
    </Link>
  )
}

function CompactProductCard({ group }: { group: DisplayGroup }) {
  const minPrice = groupMinPriceCents(group)
  const defaultVariant = groupDefaultVariant(group)
  const heroImage = defaultVariant.hero ?? defaultVariant.mock1 ?? null
  const hasMultipleVariants = group.variants.length > 1
  const href = `/shop/${COLLECTION_TO_SLUG[group.collection] ?? group.collection}/${group.id}`
  const collectionLabel = COLLECTION_LABELS[group.collection] ?? null
  const familySlug = groupFamilySlug(group)
  const familyLabel = familySlug ? FAMILY_SHORT_LABELS[familySlug] ?? null : null

  return (
    <Link href={href} className="group">
      <div className="aspect-square bg-dust/20 relative overflow-hidden mb-2">
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
      {(collectionLabel || familyLabel) && (
        <div className="flex flex-wrap gap-1 mb-1">
          {collectionLabel && (
            <span className="inline-block text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-dust/25 text-muted rounded-sm">
              {collectionLabel}
            </span>
          )}
          {familyLabel && (
            <span className="inline-block text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-dust/25 text-muted rounded-sm">
              {familyLabel}
            </span>
          )}
        </div>
      )}
      <h3 className="text-xs font-medium text-ink leading-snug line-clamp-1">{group.title}</h3>
      <p className="text-muted text-xs mt-0.5">
        {hasMultipleVariants ? 'from ' : ''}{formatPrice(minPrice)}
      </p>
    </Link>
  )
}

// ─── Inner grid (uses useSearchParams) ────────────────────────────────────────

function ShopGridInner({
  products,
  compact = false,
}: {
  products: DisplayGroup[]
  compact?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sort = (searchParams.get('sort') as SortKey | null) ?? 'featured'
  const activeLocation = searchParams.get('location')
  const activeCollection = compact ? null : searchParams.get('collection')
  const activeFamily = compact ? null : searchParams.get('family')
  const [query, setQuery] = useState('')

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val !== null) params.set(key, val)
      else params.delete(key)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  // Locations present in this product set — known cities in canonical order, new ones appended alphabetically
  const presentLocations = useMemo(() => {
    const seen = new Set<string>()
    for (const g of products) {
      const loc = extractLocation(g.id)
      if (loc) seen.add(loc)
    }
    const known = LOCATION_ORDER.filter((l) => seen.has(l))
    const novel = Array.from(seen).filter((l) => !(LOCATION_ORDER as readonly string[]).includes(l)).sort()
    return [...known, ...novel]
  }, [products])

  // Collections present (full mode only)
  const presentCollections = useMemo(() => {
    if (compact) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const g of products) {
      if (g.collection && !seen.has(g.collection)) {
        seen.add(g.collection)
        result.push(g.collection)
      }
    }
    return result
  }, [products, compact])

  // Families present (full mode only)
  const presentFamilies = useMemo(() => {
    if (compact) return []
    const codes = new Set<string>()
    for (const g of products) {
      for (const code of groupFamilyCodes(g)) codes.add(code)
    }
    return FAMILY_CONFIG.filter((fam) => fam.familyCodes.some((code) => codes.has(code)))
  }, [products, compact])

  // Filter then sort
  const displayed = useMemo(() => {
    let result = products

    if (activeCollection) {
      const col = COLLECTION_CONFIG.find((c) => c.slug === activeCollection)
      if (col) result = result.filter((g) => g.collection === col.key)
    }
    if (activeFamily) {
      const fam = FAMILY_CONFIG.find((f) => f.slug === activeFamily)
      if (fam) {
        result = result.filter((g) =>
          groupFamilyCodes(g).some((code) => fam.familyCodes.includes(code)),
        )
      }
    }
    if (activeLocation) {
      result = result.filter((g) => extractLocation(g.id) === activeLocation)
    }
    if (!compact && query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((g) => g.title.toLowerCase().includes(q))
    }

    return sortProducts(result, sort)
  }, [products, activeCollection, activeFamily, activeLocation, query, sort, compact])

  const hasActiveFilter =
    !!activeCollection || !!activeFamily || !!activeLocation || !!query.trim() || sort !== 'featured'

  function clearAll() {
    setQuery('')
    updateParams({ collection: null, family: null, location: null, sort: null })
  }

  return (
    <>
      {/* Collection filter — full mode, 2+ collections */}
      {!compact && presentCollections.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => updateParams({ collection: null })}
            className={`${pillBase} ${activeCollection === null ? pillActive : pillInactive}`}
          >
            All
          </button>
          {presentCollections.map((c) => {
            const slug = COLLECTION_TO_SLUG[c] ?? c
            return (
              <button
                key={c}
                onClick={() => updateParams({ collection: slug })}
                className={`${pillBase} ${activeCollection === slug ? pillActive : pillInactive}`}
              >
                {COLLECTION_LABELS[c] ?? c}
              </button>
            )
          })}
        </div>
      )}

      {/* Family filter — full mode, 2+ families */}
      {!compact && presentFamilies.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => updateParams({ family: null })}
            className={`${pillBase} ${activeFamily === null ? pillActive : pillInactive}`}
          >
            All
          </button>
          {presentFamilies.map((fam) => (
            <button
              key={fam.slug}
              onClick={() => updateParams({ family: fam.slug })}
              className={`${pillBase} ${activeFamily === fam.slug ? pillActive : pillInactive}`}
            >
              {fam.name}
            </button>
          ))}
        </div>
      )}

      {/* Search bar — full mode only */}
      {!compact && (
        <div className="relative mb-6 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-dust/60 bg-transparent text-ink placeholder-dust focus:outline-none focus:border-ink transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Controls row: location dropdown + sort dropdown + count + clear */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {presentLocations.length > 1 && (
          <FilterDropdown
            label="Location"
            options={presentLocations.map((loc) => ({ value: loc, label: locationLabel(loc) }))}
            value={activeLocation}
            onChange={(v) => updateParams({ location: v })}
          />
        )}
        <SortDropdown value={sort} onChange={(v) => updateParams({ sort: v })} />
        <p className="text-xs tracking-widest uppercase text-muted ml-auto">
          {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
          {!compact && query && ` for "${query}"`}
        </p>
        {hasActiveFilter && (
          <button
            onClick={clearAll}
            className="text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors underline underline-offset-4"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid or empty state */}
      {displayed.length === 0 ? (
        <div className="border border-dust/40 p-12 text-center max-w-sm">
          <p className="font-display text-xl text-ink mb-2">No results</p>
          <p className="text-sm text-muted">No products match the current filters.</p>
          <button
            onClick={clearAll}
            className="mt-4 text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      ) : compact ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
          {displayed.map((group) => (
            <CompactProductCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {displayed.map((group) => (
            <ProductCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Public export (wraps inner in Suspense for useSearchParams) ──────────────

export default function ShopGrid({
  products,
  compact = false,
}: {
  products: DisplayGroup[]
  compact?: boolean
}) {
  return (
    <Suspense>
      <ShopGridInner products={products} compact={compact} />
    </Suspense>
  )
}
