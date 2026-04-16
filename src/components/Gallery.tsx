'use client'

import { useState, useCallback } from 'react'
import type { Photo } from '@/lib/portfolio'
import JustifiedGallery from './JustifiedGallery'
import Lightbox from './Lightbox'

interface GalleryProps {
  photos: Photo[]
  collectionName: string
}

/**
 * Collection gallery: wraps JustifiedGallery with lightbox state.
 * Rotation is handled by the server component (page.tsx) before photos arrive here.
 */
export default function Gallery({ photos, collectionName }: GalleryProps) {
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

  return (
    <>
      <JustifiedGallery photos={photos} onPhotoClick={openLightbox} />

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
