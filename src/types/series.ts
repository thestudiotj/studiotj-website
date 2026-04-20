export interface TagFilter {
  all?: (string | TagFilter)[]
  any?: (string | TagFilter)[]
}

export interface Grouping {
  by_tag_prefix: string
  excluded_tags: string[]
}

export interface SubSeries {
  slug: string
  tag_filter: TagFilter
}

export interface Series {
  slug: string
  display_name: string
  description: string
  tag_filter: TagFilter | null
  grouping: Grouping | null
  sub_series: SubSeries[] | null
  evergreen_note: string
  refill_note: string
  active: boolean
  sort_order: number
}

export interface SeriesEntry {
  series_slug: string
  entry_slug: string
  display_name: string
  shoot_date: string
  approved_at: string
  hero_photo_id: string
  photo_ids: string[]
  tags: string[]
  notes?: string
}

export interface Group {
  slug: string
  display_name: string
  entries: SeriesEntry[]
  heroEntry: SeriesEntry | null
}

export interface SubSeriesResolved {
  slug: string
  display_name: string
  tag_filter: TagFilter
  entries: SeriesEntry[]
  heroEntry: SeriesEntry | null
}
