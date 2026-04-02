'use client'

import { useState, useCallback } from 'react'
import type { Photo, Layout } from '@/lib/portfolio'
import Lightbox from './Lightbox'

interface GalleryProps {
  photos: Photo[]
  layout: Layout
  collectionName: string
}

// Resolve auto layout: for now, always masonry
function resolveLayout(layout: Layout, photos: Photo[]): 'masonry' | 'grid' {
  if (layout === 'grid') return 'grid'
  if (layout === 'auto') {
    // If all photos have the same aspect ratio (within 10%), use grid
    if (photos.length > 0) {
      const ar = photos[0].aspect_ratio
      const allSame = photos.every(p => Math.abs(p.aspect_ratio - ar) < 0.1)
      if (allSame) return 'grid'
    }
  }
  return 'masonry'
}

// Column count classes based on photo count
function getMasonryColumns(count: number): { colClass: string; gapClass: string } {
  if (count <= 3) return { colClass: 'columns-1 sm:columns-2', gapClass: 'gap-3' }
  if (count <= 8) return { colClass: 'columns-1 sm:columns-2 lg:columns-3', gapClass: 'gap-2' }
  return { colClass: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4', gapClass: 'gap-1.5' }
}

function getGridColumns(count: number): string {
  if (count <= 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
  if (count <= 6) return 'grid-cols-2 md:grid-cols-3'
  return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
}

// Bottom spacing in masonry — denser for large collections
function getItemSpacing(count: number): string {
  if (count <= 5) return 'mb-3'
  if (count <= 15) return 'mb-2'
  return 'mb-1.5'
}

function PhotoPlaceholder({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const isPlaceholder = photo.url.startsWith('/sample/')

  const gradient = photo.dominant_colors.length >= 2
    ? `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1]}${photo.dominant_colors[2] ? `, ${photo.dominant_colors[2]}` : ''})`
    : `linear-gradient(145deg, #2a2a2a, #6a6a6a)`

  return (
    <div
      className="relative overflow-hidden cursor-pointer group"
      style={{ aspectRatio: photo.aspect_ratio }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${photo.title}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        style={{ background: isPlaceholder ? gradient : undefined, backgroundColor: isPlaceholder ? undefined : '#1a1a1a' }}
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
        <p className="font-display text-white/0 group-hover:text-white/90 text-sm leading-tight transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          {photo.title}
        </p>
      </div>
    </div>
  )
}

export default function Gallery({ photos, layout, collectionName }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">No photos in this collection yet.</p>
      </div>
    )
  }

  const resolvedLayout = resolveLayout(layout, photos)

  return (
    <>
      {resolvedLayout === 'masonry' ? (
        <MasonryGallery photos={photos} onPhotoClick={openLightbox} />
      ) : (
        <GridGallery photos={photos} onPhotoClick={openLightbox} />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          collectionName={collectionName}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}

function MasonryGallery({ photos, onPhotoClick }: { photos: Photo[]; onPhotoClick: (i: number) => void }) {
  const { colClass, gapClass } = getMasonryColumns(photos.length)
  const itemSpacing = getItemSpacing(photos.length)

  return (
    <div
      className={`${colClass}`}
      style={{ columnGap: photos.length <= 5 ? '12px' : photos.length <= 15 ? '8px' : '6px' }}
    >
      {photos.map((photo, i) => (
        <div key={photo.id} className={`break-inside-avoid ${itemSpacing}`}>
          <PhotoPlaceholder photo={photo} onClick={() => onPhotoClick(i)} />
        </div>
      ))}
    </div>
  )
}

function GridGallery({ photos, onPhotoClick }: { photos: Photo[]; onPhotoClick: (i: number) => void }) {
  const gridCols = getGridColumns(photos.length)
  const gap = photos.length <= 5 ? 'gap-3' : photos.length <= 15 ? 'gap-2' : 'gap-1.5'

  return (
    <div className={`grid ${gridCols} ${gap}`}>
      {photos.map((photo, i) => (
        <div key={photo.id} className="relative overflow-hidden cursor-pointer group aspect-square">
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{
              background: `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1] ?? '#4a4a4a'})`,
            }}
          />
          <div
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3"
            onClick={() => onPhotoClick(i)}
            role="button"
            tabIndex={0}
            aria-label={`View ${photo.title}`}
            onKeyDown={(e) => e.key === 'Enter' && onPhotoClick(i)}
          >
            <p className="font-display text-white/0 group-hover:text-white/90 text-sm leading-tight transition-all duration-300 translate-y-1 group-hover:translate-y-0">
              {photo.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
