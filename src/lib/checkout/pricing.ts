import type { Product, Lab } from '@/lib/catalogue'

// base_prices[lab] is in the lab's native currency (lab-native pricing).
// EU and UK both use the UK lab, so their values are GBP.
// US uses the US lab for routed products → USD.
// AU uses the AU lab for routed products → AUD.
// Currency conversion from lab native to buyer currency happens at checkout.
const ALL_LABS: Lab[] = ['EU', 'UK', 'US', 'AU']
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

function getLabBasePrice(product: Product, lab: Lab): number | null {
  if (!product.base_prices) return null
  return product.base_prices[lab] ?? null
}
