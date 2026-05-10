'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/catalogue'

const COLLECTION_LABELS: Record<string, string> = {
  'the-signature-collection': 'Signature',
  'monochrome-moods': 'Monochrome',
  'the-atmospheric-collection': 'Atmospheric',
  'the-halcyon-collection': 'Halcyon',
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const priceLabel = product.price_cents != null ? formatPrice(product.price_cents) : null

  return (
    <Link href={`/shop/${product.id}`} className="group">
      <div className="aspect-square bg-dust/20 relative overflow-hidden mb-4">
        {product.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.hero_image}
            alt={product.title}
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
        <h3 className="text-sm font-medium text-ink leading-snug">{product.title}</h3>
        {priceLabel && <p className="text-muted text-sm mt-1">{priceLabel}</p>}
      </div>
    </Link>
  )
}

// ─── ShopGrid ─────────────────────────────────────────────────────────────────

export default function ShopGrid({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [activeCollection, setActiveCollection] = useState<string | null>(null)

  const collections = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const p of products) {
      if (p.type === 'photo' && p.collection && !seen.has(p.collection)) {
        seen.add(p.collection)
        result.push(p.collection)
      }
    }
    return result
  }, [products])

  const filtered = useMemo(() => {
    let result = activeCollection
      ? products.filter((p) => p.type === 'photo' && p.collection === activeCollection)
      : products
    const q = query.trim().toLowerCase()
    if (q) result = result.filter((p) => p.title.toLowerCase().includes(q))
    return result
  }, [products, query, activeCollection])

  return (
    <>
      {/* Collection filter */}
      {collections.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCollection(null)}
            className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-colors ${
              activeCollection === null
                ? 'bg-ink text-paper border-ink'
                : 'border-dust text-muted hover:border-ink hover:text-ink'
            }`}
          >
            All
          </button>
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCollection(c)}
              className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-colors ${
                activeCollection === c
                  ? 'bg-ink text-paper border-ink'
                  : 'border-dust text-muted hover:border-ink hover:text-ink'
              }`}
            >
              {COLLECTION_LABELS[c] ?? c}
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
            Nothing matched &ldquo;{query}&rdquo;. Try a different search.
          </p>
          <button
            onClick={() => setQuery('')}
            className="mt-4 text-xs tracking-widest uppercase text-muted hover:text-ink transition-colors underline underline-offset-4"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  )
}
