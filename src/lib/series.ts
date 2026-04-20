import fs from 'fs'
import path from 'path'
import { getPortfolio } from './portfolio'
import type { Photo } from './portfolio'
import type { Series, SeriesEntry, TagFilter, Group, SubSeriesResolved } from '@/types/series'

export const DEFAULT_OG = 'https://photos.studiotj.com/og/studiotj-default.jpg'

// ─── Raw data readers ─────────────────────────────────────────────────────────

function readSeriesFile(): { version: string; series: Series[] } {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'series.json'), 'utf-8')
  )
}

function readEntriesFile(): { version: string; entries: SeriesEntry[] } {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'series_entries.json'), 'utf-8')
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

// ─── Photo map cache (safe for static builds — one process, one read) ─────────

let _photoMap: Map<string, Photo> | null = null

function getPhotoMap(): Map<string, Photo> {
  if (!_photoMap) {
    const data = getPortfolio()
    _photoMap = data ? new Map(data.photos.map(p => [p.id, p])) : new Map()
  }
  return _photoMap
}

// ─── Recency sort: approved_at → shoot_date → entry_slug (stability) ──────────

function sortByRecency(entries: SeriesEntry[]): SeriesEntry[] {
  return [...entries].sort((a, b) => {
    const c1 = b.approved_at.localeCompare(a.approved_at)
    if (c1 !== 0) return c1
    const c2 = b.shoot_date.localeCompare(a.shoot_date)
    if (c2 !== 0) return c2
    return b.entry_slug.localeCompare(a.entry_slug)
  })
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

export type SeriesShape = 'flat_filter' | 'grouped' | 'sub_series'

export function getSeriesShape(series: Series): SeriesShape {
  if (series.grouping !== null) return 'grouped'
  if (series.sub_series !== null) return 'sub_series'
  return 'flat_filter'
}

// ─── Entries ──────────────────────────────────────────────────────────────────

export function getAllEntries(): SeriesEntry[] {
  return readEntriesFile().entries
}

export function getEntriesForSeries(seriesSlug: string): SeriesEntry[] {
  return sortByRecency(getAllEntries().filter(e => e.series_slug === seriesSlug))
}

export function getEntryByPath(seriesSlug: string, entrySlug: string): SeriesEntry | null {
  return getAllEntries().find(
    e => e.series_slug === seriesSlug && e.entry_slug === entrySlug
  ) ?? null
}

export function getLatestEntry(entries: SeriesEntry[]): SeriesEntry | null {
  return entries.length > 0 ? sortByRecency(entries)[0] : null
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────

export function matchesTagFilter(entry: SeriesEntry, filter: TagFilter): boolean {
  if (filter.all) {
    return filter.all.every(cond =>
      typeof cond === 'string' ? entry.tags.includes(cond) : matchesTagFilter(entry, cond)
    )
  }
  if (filter.any) {
    return filter.any.some(cond =>
      typeof cond === 'string' ? entry.tags.includes(cond) : matchesTagFilter(entry, cond)
    )
  }
  return true
}

export function getDisplayNameForTag(tagValue: string): string {
  const overrides = readTagDisplayNames()
  if (overrides[tagValue]) return overrides[tagValue]
  // Title-case the slug part (after the last ':')
  const slug = tagValue.includes(':') ? tagValue.split(':').slice(1).join(':') : tagValue
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Groups (grouped series) ──────────────────────────────────────────────────

export function getGroupsForSeries(series: Series): Group[] {
  if (!series.grouping) return []
  const { by_tag_prefix, excluded_tags } = series.grouping
  const entries = getEntriesForSeries(series.slug)
  const groupMap = new Map<string, SeriesEntry[]>()

  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (tag.startsWith(by_tag_prefix) && !excluded_tags.includes(tag)) {
        const slug = tag.slice(by_tag_prefix.length)
        if (!groupMap.has(slug)) groupMap.set(slug, [])
        groupMap.get(slug)!.push(entry)
        break // each entry counted once per group
      }
    }
  }

  const groups: Group[] = Array.from(groupMap.entries()).map(([slug, groupEntries]) => {
    const sorted = sortByRecency(groupEntries)
    return {
      slug,
      display_name: getDisplayNameForTag(`${by_tag_prefix}${slug}`),
      entries: sorted,
      heroEntry: sorted[0] ?? null,
    }
  })

  return groups.sort((a, b) =>
    (b.heroEntry?.approved_at ?? '').localeCompare(a.heroEntry?.approved_at ?? '')
  )
}

// ─── Sub-series (sub_series series) ───────────────────────────────────────────

export function getSubSeriesForSeries(series: Series): SubSeriesResolved[] {
  if (!series.sub_series) return []
  const allEntries = getEntriesForSeries(series.slug)

  // Preserve the order defined in series.json (spring → summer → autumn → winter)
  return series.sub_series.map(ss => {
    const entries = sortByRecency(
      allEntries.filter(e => matchesTagFilter(e, ss.tag_filter))
    )
    const canonicalTag = getCanonicalTagFromFilter(ss.tag_filter) ?? ss.slug
    return {
      slug: ss.slug,
      display_name: getDisplayNameForTag(canonicalTag),
      tag_filter: ss.tag_filter,
      entries,
      heroEntry: entries[0] ?? null,
    }
  })
}

function getCanonicalTagFromFilter(filter: TagFilter): string | null {
  const first = filter.all?.[0] ?? filter.any?.[0]
  return typeof first === 'string' ? first : null
}

// ─── Homepage helpers ─────────────────────────────────────────────────────────

/** Flat deduped array of every photo_id across all series entries. */
export function getAllSeriesEntryPhotoIds(): string[] {
  const entries = getAllEntries()
  const seen = new Set<string>()
  for (const entry of entries) {
    for (const id of entry.photo_ids) {
      seen.add(id)
    }
  }
  return Array.from(seen)
}

// ─── Photo resolution ─────────────────────────────────────────────────────────

export function resolvePhoto(photoId: string): Photo | null {
  const photo = getPhotoMap().get(photoId)
  if (!photo) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[series] Photo "${photoId}" not found in portfolio.json — fix series_entries.json`
      )
    }
    console.warn(`[series] Photo "${photoId}" not found in portfolio.json`)
    return null
  }
  return photo
}

export function resolvePhotos(photoIds: string[]): Photo[] {
  return photoIds.flatMap(id => {
    const photo = resolvePhoto(id)
    return photo ? [photo] : []
  })
}
