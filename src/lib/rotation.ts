// ─── Seeded PRNG utilities ────────────────────────────────────────────────────

/** djb2-style string hash → 32-bit unsigned integer */
function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0
  }
  return h
}

/** mulberry32 PRNG — returns a function that produces floats in [0, 1) */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates shuffle using the given seed */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  const rng = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ─── CET/CEST ISO week calculation ───────────────────────────────────────────

/**
 * Returns the ISO week number and year for the given date in
 * Europe/Amsterdam timezone (CET in winter, CEST in summer).
 * Week rollover is Monday 00:00 CET/CEST.
 */
function getISOWeekInCET(date: Date): { isoWeek: number; year: number } {
  // Convert to Europe/Amsterdam time
  const cetString = date.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })
  const cetDate = new Date(cetString)

  // ISO week: the week containing Thursday belongs to the year.
  // Adjust to the Thursday of this week.
  const dayOfWeek = cetDate.getDay() || 7 // getDay(): Sun=0 → remap to 7; Mon=1..Sat=6
  const thursday = new Date(cetDate)
  thursday.setDate(cetDate.getDate() + (4 - dayOfWeek))

  const year = thursday.getFullYear()
  const yearStart = new Date(year, 0, 1)
  const isoWeek = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  )

  return { isoWeek, year }
}

// ─── Weekly gallery rotation ──────────────────────────────────────────────────

/**
 * Returns the ordered list of photo IDs to show for a collection in the
 * ISO week containing `now` (Europe/Amsterdam timezone, Monday rollover).
 *
 * Rules:
 * - ≤50 photos → return all IDs shuffled deterministically for this week.
 * - >50 photos → non-overlapping round-robin of 50-photo windows cycling
 *   through all photos. A short remainder window (< 30 photos) is padded
 *   up to 50 by borrowing from the next cycle's first round.
 *
 * Pure function — no side effects. Same inputs always yield the same output
 * on every server and every request.
 *
 * @param photoIds      Ordered list of photo IDs from portfolio.json
 * @param collectionSlug  Collection slug used as part of the seed
 * @param now           The current date/time (pass `new Date()` in production)
 * @param weekOverride  Dev-only: substitute the computed ISO week number
 */
export function getWeeklyGallery(
  photoIds: string[],
  collectionSlug: string,
  now: Date,
  weekOverride?: number
): string[] {
  if (photoIds.length === 0) return []

  const { isoWeek: computedWeek, year } = getISOWeekInCET(now)
  const isoWeek = weekOverride !== undefined && Number.isFinite(weekOverride)
    ? weekOverride
    : computedWeek

  // ── Small collection: show everything, shuffled per week ──────────────────
  if (photoIds.length <= 50) {
    const seed = hashString(`${collectionSlug}${year}${isoWeek}`)
    return seededShuffle(photoIds, seed)
  }

  // ── Large collection: round-robin windows ─────────────────────────────────

  // How many 50-photo rounds make a full cycle?
  const roundCount = Math.ceil(photoIds.length / 50)

  // Monotonically increasing week index
  const absoluteWeek = year * 53 + isoWeek

  // Which full cycle are we in, and which round within that cycle?
  const cycleNumber = Math.floor(absoluteWeek / roundCount)
  const weekInCycle = absoluteWeek % roundCount

  // Stable cycle-level shuffle determines the assignment of photos to rounds
  const cycleSeed = hashString(`${collectionSlug}${cycleNumber}`)
  const cycleOrder = seededShuffle(photoIds, cycleSeed)

  // Extract this week's window
  const start = weekInCycle * 50
  const end = Math.min(start + 50, cycleOrder.length)
  let slice = cycleOrder.slice(start, end)

  // Pad a short remainder round (< 30 photos) by borrowing from the next
  // cycle's first window — so the visitor always sees ~50 photos.
  if (slice.length < 30) {
    const nextCycleSeed = hashString(`${collectionSlug}${cycleNumber + 1}`)
    const nextCycleOrder = seededShuffle(photoIds, nextCycleSeed)
    const needed = 50 - slice.length
    slice = [...slice, ...nextCycleOrder.slice(0, needed)]
  }

  // Week-level shuffle for presentation order (different each week)
  const weekSeed = hashString(`${collectionSlug}${year}${isoWeek}`)
  return seededShuffle(slice, weekSeed)
}
