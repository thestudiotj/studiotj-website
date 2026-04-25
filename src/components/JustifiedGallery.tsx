'use client'

import { useState, useEffect, useRef } from 'react'
import justifiedLayout from 'justified-layout'
import type { Photo } from '@/lib/portfolio'

// ─── Individual photo item ────────────────────────────────────────────────────

interface BoxGeometry {
  top: number
  left: number
  width: number
  height: number
}

function JustifiedPhoto({
  photo,
  box,
  index,
  onClick,
}: {
  photo: Photo
  box: BoxGeometry
  index: number
  onClick: () => void
}) {
  const [loaded, setLoaded] = useState(false)

  const gradient =
    photo.dominant_colors.length >= 2
      ? `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1]}${photo.dominant_colors[2] ? `, ${photo.dominant_colors[2]}` : ''})`
      : `linear-gradient(145deg, #2a2a2a, #6a6a6a)`

  return (
    <div
      className="absolute overflow-hidden cursor-pointer group"
      style={{
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${photo.title}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Dominant-colour placeholder shown until image loads */}
      <div className="absolute inset-0" style={{ background: gradient }} />

      <img
        src={photo.thumbnail_url}
        alt={photo.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03]"
        style={{
          opacity: loaded ? 1 : 0,
          transition: loaded ? 'opacity 0.3s ease, transform 0.7s ease' : 'none',
        }}
        loading={index < 12 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
      />

      {/* Title overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
        <p className="font-display text-white/0 group-hover:text-white/90 text-sm leading-tight transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          {photo.title}
        </p>
      </div>
    </div>
  )
}

// ─── Justified grid ───────────────────────────────────────────────────────────

export interface JustifiedGalleryProps {
  /** Photos to display, in the order they should appear. Rotation (if any)
   *  is the caller's responsibility — this component renders whatever it receives. */
  photos: Photo[]
  onPhotoClick: (index: number) => void
}

/**
 * Reusable justified-layout gallery.
 *
 * Renders photos in horizontal rows of consistent height (Flickr/Google Photos
 * style). Landscape images are wider, portrait images are narrower. The last
 * row is left-aligned at natural sizes (not stretched).
 *
 * Fully responsive via ResizeObserver — no manual breakpoints.
 * Contains no rotation logic; pass whatever photo array you want displayed.
 */
export default function JustifiedGallery({ photos, onPhotoClick }: JustifiedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Wide desktop default so SSR output is close to correct for most visitors.
  // Recomputed on mount via ResizeObserver.
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => setContainerWidth(el.clientWidth)
    update()

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const targetRowHeight = containerWidth < 640 ? 200 : 280

  const layout = justifiedLayout(
    photos.map((p) => p.aspect_ratio),
    {
      containerWidth,
      targetRowHeight,
      boxSpacing: 12,
      containerPadding: 0,
      showWidows: true,
      fullWidthBreakoutRowCadence: false,
    }
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: layout.containerHeight }}
    >
      {layout.boxes.map((box, i) => (
        <JustifiedPhoto
          key={photos[i].id}
          photo={photos[i]}
          box={box}
          index={i}
          onClick={() => onPhotoClick(i)}
        />
      ))}
    </div>
  )
}
