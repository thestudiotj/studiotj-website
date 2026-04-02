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
    return () => { document.body.style.overflow = prev }
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

  const isPlaceholder = photo.url.startsWith('/sample/') || photo.url.startsWith('/')
  const gradient = photo.dominant_colors.length >= 2
    ? `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1]}${photo.dominant_colors[2] ? `, ${photo.dominant_colors[2]}` : ''})`
    : `linear-gradient(145deg, #1a1a1a, #4a4a4a)`

  const prevPhoto = index > 0 ? photos[index - 1] : null
  const nextPhoto = index < photos.length - 1 ? photos[index + 1] : null

  return (
    // Backdrop: dark + blur the gallery behind it. Click to close.
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col cursor-pointer"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Inner shell: stop propagation so content clicks don't close */}
      <div
        className="flex flex-col h-full cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden preload */}
        {prevPhoto && !prevPhoto.url.startsWith('/sample/') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prevPhoto.url} alt="" className="hidden" aria-hidden="true" />
        )}
        {nextPhoto && !nextPhoto.url.startsWith('/sample/') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={nextPhoto.url} alt="" className="hidden" aria-hidden="true" />
        )}

        {/* Top bar: collection name + counter */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <span className="text-white/50 text-xs tracking-[0.2em] uppercase">
            {collectionName}
          </span>
          <span className="text-white/50 text-xs tabular-nums">
            {index + 1} / {photos.length}
          </span>
        </div>

        {/* Image area — arrows are overlaid on image edges */}
        <div className="flex-1 flex items-center justify-center min-h-0 py-2">
          <div
            className="relative transition-opacity duration-150 ease-in-out"
            style={{
              opacity: isTransitioning ? 0 : 1,
              aspectRatio: photo.aspect_ratio,
              maxHeight: '100%',
              maxWidth: 'calc(100% - 80px)',
              width: `min(calc(${photo.aspect_ratio} * 78vh), calc(100% - 80px))`,
            }}
          >
            {/* Photo or placeholder */}
            {isPlaceholder ? (
              <div className="w-full h-full" style={{ background: gradient }} />
            ) : (
              <div className="relative w-full h-full">
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

            {/* Prev arrow — left edge of image, half-overlapping */}
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="absolute top-1/2 -translate-y-1/2 -left-5
                         w-10 h-10 rounded-full
                         bg-black/50 hover:bg-black/75
                         flex items-center justify-center
                         text-white
                         disabled:opacity-0 disabled:pointer-events-none
                         transition-all duration-150
                         shadow-lg"
              aria-label="Previous photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Next arrow — right edge of image, half-overlapping */}
            <button
              onClick={goNext}
              disabled={index === photos.length - 1}
              className="absolute top-1/2 -translate-y-1/2 -right-5
                         w-10 h-10 rounded-full
                         bg-black/50 hover:bg-black/75
                         flex items-center justify-center
                         text-white
                         disabled:opacity-0 disabled:pointer-events-none
                         transition-all duration-150
                         shadow-lg"
              aria-label="Next photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Caption */}
        <div className="flex-shrink-0 px-6 py-5 text-center">
          <p className="font-display text-white/80 text-lg">{photo.title}</p>
          {photo.date && (
            <p className="text-white/35 text-xs mt-1 tracking-wide">
              {new Date(photo.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
            </p>
          )}
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

      {/* Close button — fixed top-right, always on top, stops propagation */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="fixed top-4 right-4 z-[101]
                   w-11 h-11 rounded-full
                   bg-white/15 hover:bg-white/30
                   flex items-center justify-center
                   text-white
                   transition-all duration-150
                   shadow-lg backdrop-blur-sm
                   cursor-pointer"
        aria-label="Close lightbox (Escape)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
