export type TagFilter =
  | { all: string[] }
  | { any: string[] }

export type SubPool = {
  slug: string
  tag_filter: TagFilter
}

export type Series = {
  slug: string
  display_name: string
  description: string
  priority: number
  sub_pools?: SubPool[]
  routing?: 'manual_only'
  evergreen_note: string
  refill_note: string
  active: boolean
  sort_order: number
}

export type SeriesPhoto = {
  photo_id: string
  series_slug: string
  sub_pool_slug: string | null
  hero_url: string
  thumb_url: string
  width: number
  height: number
  alt: string
  shoot_date: string
  datetime_original: string | null
  route_slug?: string
  route_display_name?: string
}
