'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Image from 'next/image'
import type { Photo } from '@/lib/portfolio'

interface LightboxProps {
  photos: Photo[]
  initialIndex: number
  collectionName: string
  onClose: () => void
}

export default function Lightbox({ photos, initialIndex, collectionName, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const photo = photos[index]

  const goTo = useCallback((next: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setIndex(next)
      setIsTransitioning(false)
    }, 150)
  }, [isTransitioning])

  const goPrev = useCallback(() => {
    if (index > 0) goTo(index - 1)
  }, [index, goTo])

  const goNext = useCallback(() => {
    if (index < photos.length - 1) goTo(index + 1)
  }, [index, photos.length, goTo])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goPrev, goNext])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Touch / swipe
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

  const isPlaceholder = photo.url.startsWith('/sample/') || photo.url.startsWith('/')
  const gradient = photo.dominant_colors.length >= 2
    ? `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1]}${photo.dominant_colors[2] ? `, ${photo.dominant_colors[2]}` : ''})`
    : `linear-gradient(145deg, #1a1a1a, #4a4a4a)`

  // Preload adjacent photos using hidden Image elements
  const prevPhoto = index > 0 ? photos[index - 1] : null
  const nextPhoto = index < photos.length - 1 ? photos[index + 1] : null

  return (
    // Outer: backdrop click closes
    <div
      className="fixed inset-0 z-[100] bg-black/97 flex flex-col cursor-pointer"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Inner: clicks don't propagate to backdrop */}
      <div
        className="flex flex-col h-full cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden preload images for adjacent photos */}
        {prevPhoto && !prevPhoto.url.startsWith('/sample/') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prevPhoto.url} alt="" className="hidden" aria-hidden="true" />
        )}
        {nextPhoto && !nextPhoto.url.startsWith('/sample/') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={nextPhoto.url} alt="" className="hidden" aria-hidden="true" />
        )}

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <span className="text-white/40 text-xs tracking-[0.2em] uppercase">
            {collectionName}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-white/40 text-xs tabular-nums">
              {index + 1} / {photos.length}
            </span>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
              aria-label="Close lightbox"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex-1 flex items-center justify-center relative min-h-0 px-14 md:px-20">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="absolute left-2 md:left-4 z-10 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-colors"
            aria-label="Previous photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Photo */}
          <div
            className="transition-opacity duration-150 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
              aspectRatio: photo.aspect_ratio,
              maxHeight: '100%',
              maxWidth: '100%',
              width: `min(calc(${photo.aspect_ratio} * 80vh), 100%)`,
            }}
          >
            {isPlaceholder ? (
              <div
                className="w-full h-full"
                style={{ background: gradient, aspectRatio: photo.aspect_ratio }}
              />
            ) : (
              <div className="relative w-full h-full" style={{ aspectRatio: photo.aspect_ratio }}>
                <Image
                  src={photo.url}
                  alt={photo.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 85vw"
                  priority
                />
              </div>
            )}
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={index === photos.length - 1}
            className="absolute right-2 md:right-4 z-10 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-colors"
            aria-label="Next photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Caption */}
        <div className="flex-shrink-0 px-6 py-5 text-center">
          <p className="font-display text-white/80 text-lg">{photo.title}</p>
          {photo.date && (
            <p className="text-white/30 text-xs mt-1 tracking-wide">
              {new Date(photo.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
            </p>
          )}

          {/* Dot nav for short collections */}
          {photos.length <= 20 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === index ? 'bg-white/70 w-4' : 'bg-white/20 hover:bg-white/40 w-1.5'
                  }`}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
