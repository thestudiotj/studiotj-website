import fs from 'fs'
import path from 'path'
import type { Photo } from './portfolio'
import type { Series, SeriesEntry, SeriesEntryPhoto } from '@/types/series'

export const DEFAULT_OG = 'https://photos.studiotj.com/og/studiotj-default.jpg'

// ─── Raw data readers ─────────────────────────────────────────────────────────

function readSeriesFile(): { version: string; series: Series[] } {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'series.json'), 'utf-8')
  )
}

function readSeriesEntriesFile(): { version: string; entries: SeriesEntry[] } {
  const filePath = path.join(process.cwd(), 'data', 'series_entries.json')
  if (!fs.existsSync(filePath)) return { version: '2.0', entries: [] }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
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

// ─── Series Entries ───────────────────────────────────────────────────────────

export function getAllSeriesEntries(): SeriesEntry[] {
  return readSeriesEntriesFile().entries
}

export function getEntriesForSeries(seriesSlug: string): SeriesEntry[] {
  return getAllSeriesEntries()
    .filter(e => e.series_slug === seriesSlug)
    .sort((a, b) => b.shoot_date.localeCompare(a.shoot_date))
}

export function getEntryBySlug(seriesSlug: string, entrySlug: string): SeriesEntry | null {
  return getAllSeriesEntries().find(
    e => e.series_slug === seriesSlug && e.entry_slug === entrySlug
  ) ?? null
}

export function getPhotosForEntry(seriesSlug: string, entrySlug: string): SeriesEntryPhoto[] {
  return getEntryBySlug(seriesSlug, entrySlug)?.photos ?? []
}

export function getPhotoCountForSeries(seriesSlug: string): number {
  return getEntriesForSeries(seriesSlug).reduce((sum, e) => sum + e.photos.length, 0)
}

// ─── Route/Visit entry cards ──────────────────────────────────────────────────

export type ShootBoundEntry = {
  series_slug: string
  entry_slug: string
  display_name: string
  shoot_date: string
  photo_count: number
  hero_thumb_url: string | null
}

export function getShootBoundEntries(seriesSlug: string): ShootBoundEntry[] {
  return getEntriesForSeries(seriesSlug).map(entry => ({
    series_slug: entry.series_slug,
    entry_slug: entry.entry_slug,
    display_name: entry.display_name,
    shoot_date: entry.shoot_date,
    photo_count: entry.photos.length,
    hero_thumb_url: entry.photos[0]?.thumb_url ?? null,
  }))
}

// Alias for backward compat with page components
export function getRouteEntries() {
  return getShootBoundEntries('routes').map(e => ({
    route_slug: e.entry_slug,
    display_name: e.display_name,
    shoot_date: e.shoot_date,
    photo_count: e.photo_count,
    hero_thumb_url: e.hero_thumb_url,
  }))
}

// ─── Hero derivation ──────────────────────────────────────────────────────────

export type HeroPhoto = { hero_url: string; thumb_url: string }

export function getDerivedHero(photos: SeriesEntryPhoto[]): HeroPhoto | null {
  if (photos.length === 0) return null
  return { hero_url: photos[0].hero_url, thumb_url: photos[0].thumb_url }
}

// ─── For series landing page — hero per series ────────────────────────────────

export function getSeriesHero(seriesSlug: string): HeroPhoto | null {
  const entries = getEntriesForSeries(seriesSlug)
  const first = entries[0]?.photos[0]
  if (!first) return null
  return { hero_url: first.hero_url, thumb_url: first.thumb_url }
}

// ─── Photo conversion ─────────────────────────────────────────────────────────

export function entryPhotoToGalleryPhoto(p: SeriesEntryPhoto, shootDate: string): Photo {
  return {
    id: p.photo_id,
    url: p.hero_url,
    thumbnail_url: p.thumb_url,
    title: p.alt,
    aspect_ratio: p.width / p.height,
    dominant_colors: [],
    collections: [],
    shoot_folder: '',
    date: shootDate,
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

// ─── Legacy compat ────────────────────────────────────────────────────────────
// Keep these exports to avoid breaking any page that imports them by name.

/** @deprecated Use getPhotosForEntry */
export function getPhotosForRoute(routeSlug: string): SeriesEntryPhoto[] {
  return getPhotosForEntry('routes', routeSlug)
}

/** @deprecated getSeriesPhotosBySubPool no longer applies — series have no sub-pools */
export function getSeriesPhotosBySubPool(_seriesSlug: string, _subPoolSlug: string): SeriesEntryPhoto[] {
  return []
}

/** @deprecated getAllSeriesPhotos no longer applies — use getAllSeriesEntries */
export function getAllSeriesPhotos(): SeriesEntryPhoto[] {
  return getAllSeriesEntries().flatMap(e => e.photos)
}

export function getAllPhotoIdsInSeries(): string[] {
  return Array.from(new Set(getAllSeriesPhotos().map(p => p.photo_id)))
}
