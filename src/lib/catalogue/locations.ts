// Known cities in preferred display order. New slugs not listed here appear alphabetically after.
export const LOCATION_ORDER = ['leiden', 'katwijk', 'thehague', 'roelof', 'asp'] as const

export const LOCATION_LABELS: Record<string, string> = {
  leiden:   'Leiden',
  katwijk:  'Katwijk',
  thehague: 'The Hague',
  roelof:   'Roelofarendsveen',
  asp:      'Amsterdam',
}

/** Returns the display label for any location slug, known or new. */
export function locationLabel(slug: string): string {
  return LOCATION_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

/** Extracts location slug from a photo product ID: photo-{collection}-{location}-{photoId}-{family} */
export function extractLocation(id: string): string | null {
  const parts = id.split('-')
  if (parts[0] !== 'photo' || parts.length < 3) return null
  return parts[2] ?? null
}

/** Extracts ISO shoot date from a photo_id like "2025-05-22-LeidenPolderpark-..." */
export function extractShootDate(photo_id: string | null | undefined): string {
  if (!photo_id) return '0000-00-00'
  const match = photo_id.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : '0000-00-00'
}
