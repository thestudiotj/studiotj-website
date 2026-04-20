'use client'

import { useState } from 'react'
import type { Photo } from '@/lib/portfolio'

interface SeriesRotatorProps {
  photos: Photo[]
}

/**
 * Picks one photo at random on mount and renders it at 3:2 aspect ratio.
 * Server renders an empty shell (no photo); client swaps in the random pick.
 * Intentional flash matches the CollectionCard pattern.
 */
export default function SeriesRotator({ photos }: SeriesRotatorProps) {
  const [photo] = useState<Photo | null>(() =>
    photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)] : null
  )

  return (
    <div
      className="relative w-full overflow-hidden bg-dust/20"
      style={{ aspectRatio: '3 / 2' }}
    >
      {photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={photo.url}
          alt={photo.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  )
}
