'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Masonry from 'react-masonry-css'
import type { Photo } from '@/lib/portfolio'
import type { JournalPhoto } from '@/lib/journal'
import Lightbox from './Lightbox'

interface JournalGalleryProps {
  photos: JournalPhoto[]
  entryTitle: string
}

// Adapt JournalPhoto to satisfy Lightbox's Photo[] type requirement.
// Lightbox doesn't use photo.collections, so an empty array is safe here.
function toPhoto(p: JournalPhoto): Photo {
  return { ...p, collections: [] }
}

const BREAKPOINTS = { default: 3, 1024: 2, 640: 1 }

export default function JournalGallery({ photos, entryTitle }: JournalGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const openLightbox = useCallback((i: number) => setLightboxIndex(i), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  if (photos.length === 0) return null

  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="journal-masonry"
        columnClassName="journal-masonry-col"
      >
        {photos.map((photo, i) => {
          const gradient =
            photo.dominant_colors.length >= 2
              ? `linear-gradient(145deg, ${photo.dominant_colors[0]}, ${photo.dominant_colors[1]}${photo.dominant_colors[2] ? `, ${photo.dominant_colors[2]}` : ''})`
              : 'linear-gradient(145deg, #2a2a2a, #6a6a6a)'

          return (
            <div
              key={photo.id}
              className="relative overflow-hidden cursor-pointer group"
              style={{ aspectRatio: photo.aspect_ratio, background: gradient }}
              onClick={() => openLightbox(i)}
              role="button"
              tabIndex={0}
              aria-label={`View ${photo.title}`}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox(i)}
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                <Image
                  src={photo.thumbnail_url}
                  alt={photo.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
                <p className="font-display text-white/0 group-hover:text-white/90 text-sm leading-tight transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  {photo.title}
                </p>
              </div>
            </div>
          )
        })}
      </Masonry>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos.map(toPhoto)}
          initialIndex={lightboxIndex}
          collectionName={entryTitle}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}
