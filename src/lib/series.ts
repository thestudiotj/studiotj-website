import fs from 'fs'
import path from 'path'
import type { Photo } from './portfolio'
import type { Series, SeriesPhoto } from '@/types/series'

export const DEFAULT_OG = 'https://photos.studiotj.com/og/studiotj-default.jpg'

// ─── Raw data readers ─────────────────────────────────────────────────────────

function readSeriesFile(): { version: string; series: Series[] } {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'series.json'), 'utf-8')
  )
}

function readSeriesPhotosFile(): { version: string; photos: SeriesPhoto[] } {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'series-photos.json'), 'utf-8')
  )
}

function readTagDisplayNames(): Record<string, string> {
  const filePath = path.join(process.cwd(), 'data', 'tag_display_names.json')
  if (!fs.existsSync(filePath)) return {}
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
      display_names?: Record<string, string>
    }
    return data.display_names ?? {}
  } catch {
    return {}
  }
}

// ─── Series ───────────────────────────────────────────────────────────────────

export function getAllSeries(): Series[] {
  return readSeriesFile().series
    .filter(s => s.active)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function getSeriesBySlug(slug: string): Series | null {
  return getAllSeries().find(s => s.slug === slug) ?? null
}

// ─── Series Photos ────────────────────────────────────────────────────────────

export function getAllSeriesPhotos(): SeriesPhoto[] {
  return readSeriesPhotosFile().photos
}

export function getSeriesPhotosBySubPool(seriesSlug: string, subPoolSlug: string): SeriesPhoto[] {
  // Deterministic server order: datetime_original descending (latest first).
  // Client-side PoolGallery shuffles on mount.
  return getAllSeriesPhotos()
    .filter(p => p.series_slug === seriesSlug && p.sub_pool_slug === subPoolSlug)
    .sort((a, b) => {
      const aDate = a.datetime_original ?? a.shoot_date
      const bDate = b.datetime_original ?? b.shoot_date
      return bDate.localeCompare(aDate)
    })
}

export type RouteEntry = {
  route_slug: string
  display_name: string
  shoot_date: string
  photo_count: number
  hero_thumb_url: string | null
}

export function getRouteEntries(): RouteEntry[] {
  const routePhotos = getAllSeriesPhotos().filter(p => p.series_slug === 'routes')
  const grouped = new Map<string, SeriesPhoto[]>()
  for (const photo of routePhotos) {
    if (!photo.route_slug) continue
    const arr = grouped.get(photo.route_slug) ?? []
    arr.push(photo)
    grouped.set(photo.route_slug, arr)
  }
  return Array.from(grouped.entries())
    .map(([route_slug, photos]) => {
      // Sort chronologically to get the first photo as hero
      const sorted = [...photos].sort((a, b) =>
        (a.datetime_original ?? a.shoot_date).localeCompare(b.datetime_original ?? b.shoot_date)
      )
      return {
        route_slug,
        display_name: photos[0].route_display_name ?? route_slug,
        shoot_date: photos[0].shoot_date,
        photo_count: photos.length,
        hero_thumb_url: sorted[0]?.thumb_url ?? null,
      }
    })
    .sort((a, b) => b.shoot_date.localeCompare(a.shoot_date))
}

export function getPhotosForRoute(routeSlug: string): SeriesPhoto[] {
  return getAllSeriesPhotos()
    .filter(p => p.series_slug === 'routes' && p.route_slug === routeSlug)
    .sort((a, b) =>
      (a.datetime_original ?? a.shoot_date).localeCompare(b.datetime_original ?? b.shoot_date)
    )
}

export function getDerivedHero(photos: SeriesPhoto[]): SeriesPhoto | null {
  return photos.length > 0 ? photos[0] : null
}

export function getAllPhotoIdsInSeries(): string[] {
  return Array.from(new Set(getAllSeriesPhotos().map(p => p.photo_id)))
}

// ─── Photo conversion ─────────────────────────────────────────────────────────

export function seriesPhotoToGalleryPhoto(p: SeriesPhoto): Photo {
  if (!p.hero_url) {
    console.warn(`[series] Photo "${p.photo_id}" has no hero_url`)
  }
  return {
    id: p.photo_id,
    url: p.hero_url,
    thumbnail_url: p.thumb_url,
    title: p.alt,
    aspect_ratio: p.width / p.height,
    dominant_colors: [],
    collections: [],
    shoot_folder: '',
    date: p.shoot_date,
  }
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────

export function getDisplayNameForTag(tagValue: string): string {
  const overrides = readTagDisplayNames()
  if (overrides[tagValue]) return overrides[tagValue]
  const slug = tagValue.includes(':') ? tagValue.split(':').slice(1).join(':') : tagValue
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
