export const LOCATION_ORDER = ['leiden', 'katwijk', 'thehague', 'roelof', 'asp'] as const
export type LocationSlug = (typeof LOCATION_ORDER)[number]

export const LOCATION_LABELS: Record<string, string> = {
  leiden:   'Leiden',
  katwijk:  'Katwijk',
  thehague: 'The Hague',
  roelof:   'Roelof',
  asp:      'Asp',
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
