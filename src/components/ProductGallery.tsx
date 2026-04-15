'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { PrintifyImage } from '@/lib/printify'

// ─── Product Lightbox ─────────────────────────────────────────────────────────

function ProductLightbox({
  images,
  initialIndex,
  productTitle,
  onClose,
}: {
  images: PrintifyImage[]
  initialIndex: number
  productTitle: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const goTo = useCallback(
    (next: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setIndex(next)
        setIsTransitioning(false)
      }, 150)
    },
    [isTransitioning]
  )

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1)
  }, [index, goTo])

  const goNext = useCallback(() => {
    if (index < images.length - 1) goTo(index + 1)
  }, [index, images.length, goTo])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goPrev, goNext])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const dy = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      dx > 0 ? goNext() : goPrev()
    }
  }

  const image = images[index]

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col cursor-pointer"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex flex-col h-full cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preload adjacent images */}
        {index > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[index - 1].src} alt="" className="hidden" aria-hidden="true" />
        )}
        {index < images.length - 1 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[index + 1].src} alt="" className="hidden" aria-hidden="true" />
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <span className="text-white/50 text-xs tracking-[0.2em] uppercase">
            {productTitle}
          </span>
          <span className="text-white/50 text-xs tabular-nums">
            {index + 1} / {images.length}
          </span>
        </div>

        {/* Image area */}
        <div className="flex-1 flex items-center justify-center min-h-0 py-2">
          <div
            className="relative transition-opacity duration-150 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
              maxHeight: '100%',
              maxWidth: 'calc(100% - 80px)',
              width: 'calc(100% - 80px)',
              aspectRatio: '1 / 1',
            }}
          >
            <img
              src={image.src}
              alt={`${productTitle} — image ${index + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
              loading="eager"
            />

            {/* Prev arrow */}
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="absolute top-1/2 -translate-y-1/2 -left-5
                         w-10 h-10 rounded-full
                         bg-black/50 hover:bg-black/75
                         flex items-center justify-center text-white
                         disabled:opacity-0 disabled:pointer-events-none
                         transition-all duration-150 shadow-lg"
              aria-label="Previous image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Next arrow */}
            <button
              onClick={goNext}
              disabled={index === images.length - 1}
              className="absolute top-1/2 -translate-y-1/2 -right-5
                         w-10 h-10 rounded-full
                         bg-black/50 hover:bg-black/75
                         flex items-center justify-center text-white
                         disabled:opacity-0 disabled:pointer-events-none
                         transition-all duration-150 shadow-lg"
              aria-label="Next image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dot navigation */}
        {images.length <= 20 && (
          <div className="flex-shrink-0 py-5 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? 'bg-white/70 w-4' : 'bg-white/20 hover:bg-white/40 w-1.5'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="fixed top-4 right-4 z-[101]
                   w-11 h-11 rounded-full
                   bg-white/15 hover:bg-white/30
                   flex items-center justify-center text-white
                   transition-all duration-150 shadow-lg backdrop-blur-sm cursor-pointer"
        aria-label="Close (Escape)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

// ─── Image filtering ──────────────────────────────────────────────────────────

function filterImagesByVariantIds(
  images: PrintifyImage[],
  variantIds: number[]
): PrintifyImage[] {
  if (variantIds.length === 0) return images

  const variantImages = images.filter((img) =>
    img.variant_ids.some((id) => variantIds.includes(id))
  )

  if (variantImages.length === 0) return images

  // Deduplicate by position — one image per angle
  const seen = new Set<string>()
  return variantImages.filter((img) => {
    if (seen.has(img.position)) return false
    seen.add(img.position)
    return true
  })
}

// ─── ProductGallery ───────────────────────────────────────────────────────────

const THUMBS_VISIBLE = 7

export default function ProductGallery({
  images,
  colorVariantIds,
  productTitle,
}: {
  images: PrintifyImage[]
  colorVariantIds: number[]
  productTitle: string
}) {
  const filtered = useMemo(
    () => filterImagesByVariantIds(images, colorVariantIds),
    [images, colorVariantIds]
  )

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Reset gallery when color selection changes
  const colorKey = colorVariantIds.join(',')
  const prevColorKey = useRef(colorKey)
  useEffect(() => {
    if (prevColorKey.current !== colorKey) {
      prevColorKey.current = colorKey
      setSelectedIdx(0)
      setThumbOffset(0)
    }
  }, [colorKey])

  const safeIdx = Math.min(selectedIdx, Math.max(0, filtered.length - 1))
  const activeImage = filtered[safeIdx] ?? null

  const canScrollPrev = thumbOffset > 0
  const canScrollNext = thumbOffset + THUMBS_VISIBLE < filtered.length

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Featured image */}
        <button
          onClick={() => filtered.length > 0 && setLightboxOpen(true)}
          className="relative aspect-square bg-dust/20 overflow-hidden w-full cursor-zoom-in group"
          aria-label="View full size"
        >
          {activeImage ? (
            <img
              src={activeImage.src}
              alt={`${productTitle} — view ${safeIdx + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted text-xs tracking-widest uppercase">No image</span>
            </div>
          )}
          {/* Zoom hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-200 flex items-end justify-end p-3 pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 text-white text-xs px-2 py-1 backdrop-blur-sm">
              Click to zoom
            </span>
          </div>
        </button>

        {/* Thumbnail strip */}
        {filtered.length > 1 && (
          <div className="flex items-center gap-2">
            {/* Prev button */}
            <button
              onClick={() => setThumbOffset(Math.max(0, thumbOffset - 1))}
              disabled={!canScrollPrev}
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center
                         border border-dust/40 text-muted
                         hover:border-ink hover:text-ink transition-colors
                         disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Previous thumbnails"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Thumbnails */}
            <div className="flex gap-2 flex-1 overflow-hidden">
              {filtered.slice(thumbOffset, thumbOffset + THUMBS_VISIBLE).map((img, i) => {
                const idx = i + thumbOffset
                return (
                  <button
                    key={img.src}
                    onClick={() => setSelectedIdx(idx)}
                    className={`relative w-16 h-16 flex-shrink-0 overflow-hidden border transition-colors ${
                      safeIdx === idx ? 'border-ink' : 'border-dust/40 hover:border-dust'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img.src}
                      alt={`${productTitle} thumbnail ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                )
              })}
            </div>

            {/* Next button */}
            <button
              onClick={() =>
                setThumbOffset(Math.min(filtered.length - THUMBS_VISIBLE, thumbOffset + 1))
              }
              disabled={!canScrollNext}
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center
                         border border-dust/40 text-muted
                         hover:border-ink hover:text-ink transition-colors
                         disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Next thumbnails"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && filtered.length > 0 && (
        <ProductLightbox
          images={filtered}
          initialIndex={safeIdx}
          productTitle={productTitle}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
