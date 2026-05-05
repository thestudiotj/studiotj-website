import type { Product, Lab } from '@/lib/catalogue'

const ALL_LABS: Lab[] = ['EU', 'UK', 'US']
const TOLERANCE_CENTS = 5

interface PriceBoundsResult {
  ok: boolean
  expected: number[]
  received: number
}

export function verifyPrice(product: Product, claimedCents: number): PriceBoundsResult {
  const candidates: number[] = []

  for (const lab of ALL_LABS) {
    const baseDecimal = getLabBasePrice(product, lab)
    if (baseDecimal == null) continue
    const withMargin = baseDecimal * (1 + product.margin_pct / 100)
    const cents = Math.round(withMargin * 100)
    candidates.push(cents)
  }

  if (candidates.length === 0) {
    return { ok: false, expected: [], received: claimedCents }
  }

  const ok = candidates.some((c) => Math.abs(c - claimedCents) <= TOLERANCE_CENTS)
  return { ok, expected: candidates, received: claimedCents }
}

// Stub until Session 12a adds base_prices to catalogue products.
// Returns null → verifyPrice returns expected:[] → route trusts cart price with a warning.
function getLabBasePrice(_product: Product, _lab: Lab): number | null {
  return null
}
