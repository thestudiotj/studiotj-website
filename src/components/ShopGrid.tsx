'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getPriceRange, formatPrice, type PrintifyProduct } from '@/lib/printify'
import { getBlackOrDefaultImages, getProductCategory } from '@/lib/shopHelpers'

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: PrintifyProduct }) {
  const { primary, hover } = getBlackOrDefaultImages(product)
  const { min, max } = getPriceRange(product)
  const priceLabel =
    min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`

  return (
    <Link href={`/shop/${product.id}`} className="group">
      <div className="aspect-square bg-dust/20 relative overflow-hidden mb-4">
        {primary ? (
          <>
            <img
              src={primary.src}
              alt={product.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
                hover ? 'group-hover:opacity-0' : 'group-hover:scale-[1.04]'
              }`}
              loading="lazy"
            />
            {hover && (
              <img
                src={hover.src}
                alt={`${product.title} — alternate view`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted text-xs tracking-widest uppercase">No image</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-ink leading-snug">{product.title}</h3>
        <p className="text-muted text-sm mt-1">{priceLabel}</p>
      </div>
    </Link>
  )
}

// ─── ShopGrid ─────────────────────────────────────────────────────────────────

export default function ShopGrid({ products }: { products: PrintifyProduct[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const title = p.title.toLowerCase()
      const category = getProductCategory(p).toLowerCase()
      const tags = p.tags.join(' ').toLowerCase()
      return title.includes(q) || category.includes(q) || tags.includes(q)
    })
  }, [products, query])

  return (
    <>
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
