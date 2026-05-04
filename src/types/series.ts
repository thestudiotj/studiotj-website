export type Series = {
  slug: string
  display_name: string
  description: string
  mechanism: 'shoot_bound' | 'curatorial'
  evergreen_note: string
  refill_note: string
  active: boolean
  sort_order: number
}

export type SeriesEntryPhoto = {
  photo_id: string
  hero_url: string
  thumb_url: string
  width: number
  height: number
  alt: string
  datetime_original?: string | null
}

export type SeriesEntry = {
  series_slug: string
  entry_slug: string
  display_name: string
  shoot_date: string
  shoot_folder?: string
  photos: SeriesEntryPhoto[]
}
