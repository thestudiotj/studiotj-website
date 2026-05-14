const TOLERANCE_CENTS = 5

interface PriceBoundsResult {
  ok: boolean
  expected: number[]
  received: number
}

interface PriceVerifiable {
  price_cents: number
}

// Authoritative storefront price is variant.price_cents (computed by
// scripts/extract-prodigi-pricing.py with cost-basis FX handling). The cart
// sends that same value; this check guards against tampering with a small
// rounding tolerance.
export function verifyPrice(product: PriceVerifiable, claimedCents: number): PriceBoundsResult {
  if (!product.price_cents) {
    return { ok: false, expected: [], received: claimedCents }
  }
  const ok = Math.abs(product.price_cents - claimedCents) <= TOLERANCE_CENTS
  return { ok, expected: [product.price_cents], received: claimedCents }
}
