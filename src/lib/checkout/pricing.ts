import type { Lab, ProductBasePrices } from '@/lib/catalogue'

const ALL_LABS: Lab[] = ['EU', 'UK', 'US', 'AU']
const TOLERANCE_CENTS = 5

interface PriceBoundsResult {
  ok: boolean
  expected: number[]
  received: number
}

interface PriceVerifiable {
  base_prices?: ProductBasePrices
  margin_pct: number
}

export function verifyPrice(product: PriceVerifiable, claimedCents: number): PriceBoundsResult {
  const candidates: number[] = []

  for (const lab of ALL_LABS) {
    const baseDecimal = product.base_prices?.[lab] ?? null
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
