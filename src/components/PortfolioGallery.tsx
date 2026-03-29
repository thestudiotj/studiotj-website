'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Photo {
  filename: string
  filepath: string
  title?: string
  description?: string
  edit_style?: string
}

export default function PortfolioGallery({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div className="border border-dust/40 p-12 text-center">
        <p className="text-muted">No photos yet.</p>
        <p className="text-sm text-dust mt-2">
          Run the photo sorter to generate a manifest, then add your images to{' '}
          <code className="bg-dust/30 px-1">public/photos/</code>
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Masonry grid */}
      <div className="photo-grid-masonry">
        {photos.map((photo) => (
          <div
            key={photo.filename}
            className="photo-card"
            onClick={() => setLightbox(photo)}
          >
            {/* Replace with actual image path once photos are in public/ */}
            <div className="aspect-[4/3] bg-dust/30 relative overflow-hidden group">
              {/* Uncomment when images exist:
              <Image
                src={`/photos/${photo.filename}`}
                alt={photo.title ?? photo.filename}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              */}
              <div className="absolute inset-0 flex items-center justify-center text-dust text-sm">
                {photo.filename}
              </div>
              <div className="photo-card-overlay">
                <div>
                  {photo.title && (
                    <p className="text-paper font-display text-lg leading-tight">{photo.title}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-paper text-2xl"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <div
            className="max-w-5xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[3/2] bg-ink/50 relative mb-6">
              {/* Image goes here */}
              <div className="absolute inset-0 flex items-center justify-center text-dust">
                {lightbox.filename}
              </div>
            </div>
            {lightbox.title && (
              <h3 className="font-display text-2xl text-paper mb-2">{lightbox.title}</h3>
            )}
            {lightbox.description && (
              <p className="text-dust leading-relaxed max-w-2xl">{lightbox.description}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
