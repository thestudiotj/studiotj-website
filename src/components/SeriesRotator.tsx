'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SeriesEntry, SeriesEntryPhoto } from '@/types/series'
import { routeSlugToTitle } from '@/lib/utils'

interface SeriesRotatorProps {
  entries: SeriesEntry[]
}

function formatShootDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

type Pick = { entry: SeriesEntry; photo: SeriesEntryPhoto }

function buildPool(entries: SeriesEntry[]): Pick[] {
  const pool: Pick[] = []
  for (const entry of entries) {
    for (const photo of entry.photos) {
      pool.push({ entry, photo })
    }
  }
  return pool
}

export default function SeriesRotator({ entries }: SeriesRotatorProps) {
  const [pick] = useState<Pick | null>(() => {
    const pool = buildPool(entries)
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
  })

  if (!pick) {
    return (
      <div
        className="relative w-full overflow-hidden bg-dust/20"
        style={{ aspectRatio: '3 / 2' }}
      />
    )
  }

  const { entry, photo } = pick
  const title = entry.display_name?.trim() || routeSlugToTitle(entry.entry_slug)
  const href = `/series/${entry.series_slug}/${entry.entry_slug}`

  return (
    <Link href={href} className="group block">
      <div
        className="relative w-full overflow-hidden bg-dust/20"
        style={{ aspectRatio: '3 / 2' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.thumb_url}
          alt={photo.alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <div className="mt-3">
        <p className="font-display text-lg text-ink group-hover:text-muted transition-colors leading-snug">
          {title}
        </p>
        {entry.shoot_date && (
          <p className="text-muted text-sm mt-1">{formatShootDate(entry.shoot_date)}</p>
        )}
      </div>
    </Link>
  )
}
