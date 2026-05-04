'use client'

import { useState } from 'react'
import type { SeriesEntryPhoto } from '@/types/series'
import type { Photo } from '@/lib/portfolio'
import Gallery from './Gallery'

function toPhoto(p: SeriesEntryPhoto): Photo {
  return {
    id: p.photo_id,
    url: p.hero_url,
    thumbnail_url: p.thumb_url,
    title: p.alt,
    aspect_ratio: p.width / p.height,
    dominant_colors: [],
    collections: [],
    shoot_folder: '',
    date: '',
  }
}

/**
 * Pool gallery for series sub_pool pages.
 * Server passes photos sorted by datetime_original descending (latest first).
 * Client shuffles on mount so the order feels fresh each visit.
 *
 * When a pool exceeds 50 photos, switch the server-side fetch to use
 * getRotatedPhotoIds with a weekly ISO seed — see lib/series.ts.
 */
export default function PoolGallery({ photos }: { photos: SeriesEntryPhoto[] }) {
  const [shuffled] = useState<SeriesEntryPhoto[]>(() => {
    const arr = [...photos]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })

  return <Gallery photos={shuffled.map(toPhoto)} />
}
