'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { GroupedProduct, ProductVariant } from '@/lib/catalogue/types'
import { COLLECTION_TO_SLUG } from '@/lib/catalogue/collections'
import { FAMILY_CONFIG } from '@/lib/catalogue/families'

function groupMinPriceCents(group: GroupedProduct): number {
  return Math.min(...group.variants.map((v) => v.price_cents))
}

function groupDefaultVariant(group: GroupedProduct): ProductVariant {
  const idx = Math.min(group.default_variant, group.variants.length - 1)
  return group.variants[idx]
}

const COLLECTION_LABELS: Record<string, string> = {
  'the-signature-collection': 'Signature',
  'monochrome-moods': 'Monochrome',
  'the-atmospheric-collection': 'Atmospheric',
  'the-halcyon-collection': 'Halcyon',
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const pillBase = 'px-4 py-1.5 text-xs tracking-wider uppercase border transition-colors'
const pillActive = 'bg-ink text-paper border-ink'
const pillInactive = 'border-dust text-muted hover:border-ink hover:text-ink'

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ group }: { group: GroupedProduct }) {
  const minPrice = groupMinPriceCents(group)
  const defaultVariant = groupDefaultVariant(group)
  const heroImage = defaultVariant.hero ?? defaultVariant.mock1 ?? null
  const hasMultipleVariants = group.variants.length > 1

  return (
    <Link href={`/shop/${COLLECTION_TO_SLUG[group.collection] ?? group.collection}/${group.id}`} className="group">
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
      <div>
        <h3 className="text-sm font-medium text-ink leading-snug">{group.title}</h3>
        <p className="text-muted text-sm mt-1">
          {hasMultipleVariants ? 'from ' : ''}{formatPrice(minPrice)}
        </p>
      </div>
    </Link>
  )
}

// ─── ShopGrid ─────────────────────────────────────────────────────────────────

export default function ShopGrid({ products }: { products: GroupedProduct[] }) {
  const [query, setQuery] = useState('')
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [activeFamily, setActiveFamily] = useState<string | null>(null)

  // Collection filter list (hidden when only one collection present)
  const collections = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const g of products) {
      if (g.collection && !seen.has(g.collection)) {
        seen.add(g.collection)
        result.push(g.collection)
      }
    }
    return result
  }, [products])

  // Product families present in this product set, in FAMILY_CONFIG order
  const presentFamilies = useMemo(() => {
    const productFamilyCodes = new Set(products.map((g) => g.family))
    return FAMILY_CONFIG.filter((fam) =>
      fam.familyCodes.some((code) => productFamilyCodes.has(code))
    )
  }, [products])

  const filtered = useMemo(() => {
    let result = activeCollection
      ? products.filter((g) => g.collection === activeCollection)
      : products
    if (activeFamily) {
      const famMeta = FAMILY_CONFIG.find((f) => f.slug === activeFamily)
      if (famMeta) result = result.filter((g) => famMeta.familyCodes.includes(g.family))
    }
    const q = query.trim().toLowerCase()
    if (q) result = result.filter((g) => g.title.toLowerCase().includes(q))
    return result
  }, [products, query, activeCollection, activeFamily])

  const hasActiveFilter = activeFamily !== null || query !== ''

  function clearAll() {
    setQuery('')
    setActiveFamily(null)
    setActiveCollection(null)
  }

  return (
    <>
      {/* Collection filter — only shown when multiple collections are present */}
      {collections.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCollection(null)}
            className={`${pillBase} ${activeCollection === null ? pillActive : pillInactive}`}
          >
            All
          </button>
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCollection(c)}
              className={`${pillBase} ${activeCollection === c ? pillActive : pillInactive}`}
            >
              {COLLECTION_LABELS[c] ?? c}
            </button>
          ))}
        </div>
      )}

      {/* Product category filter — shown when 2+ families present */}
      {presentFamilies.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveFamily(null)}
            className={`${pillBase} ${activeFamily === null ? pillActive : pillInactive}`}
          >
            All
          </button>
          {presentFamilies.map((fam) => (
            <button
              key={fam.slug}
              onClick={() => setActiveFamily(fam.slug)}
              className={`${pillBase} ${activeFamily === fam.slug ? pillActive : pillInactive}`}
            >
              {fam.name}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-8 max-w-sm">
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

      {/* Count */}
      <p className="text-xs tracking-widest uppercase text-muted mb-8">
        {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        {query && ` for "${query}"`}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-dust/40 p-12 text-center max-w-sm">
          <p className="font-display text-xl text-ink mb-2">No results</p>
          <p className="text-sm text-muted">
            {query
              ? `Nothing matched “${query}”.`
              : 'No products match the current filters.'}
          </p>
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              className="mt-4 text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {filtered.map((group) => (
            <ProductCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </>
  )
}
