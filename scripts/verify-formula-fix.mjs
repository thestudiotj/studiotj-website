#!/usr/bin/env node
/**
 * Local verification of the Session 2 formula fix.
 *
 * Loads the catalogue from MDX, picks a representative variant from each
 * affected family, and asserts:
 *   1. price_cents matches the expected post-fix value.
 *   2. verifyPrice accepts the new price.
 *   3. verifyPrice rejects the pre-fix price (raise families only).
 *
 * No Stripe / Prodigi / network calls.
 */
import { getVariantForCheckout } from '../src/lib/catalogue/loader.ts'
import { verifyPrice } from '../src/lib/checkout/pricing.ts'

const CASES = [
  // Raise families — price went up ~15% via formula fix
  { variantId: 'photo-atmospheric-leiden-017-hpr-a3', expected: 2076, prePrice: 1800, raise: true },
  { variantId: 'photo-atmospheric-leiden-017-hge-a3', expected: 2076, prePrice: 1800, raise: true },
  { variantId: 'photo-atmospheric-leiden-017-fap-a4-black', expected: 6458, prePrice: 5600, raise: true },
  // Re-target families — price preserved via margin reduction
  { variantId: 'photo-atmospheric-leiden-017-ema-a3', expected: 1190, raise: false },
  { variantId: 'photo-atmospheric-leiden-017-can-16x12', expected: 4080, raise: false },
  { variantId: 'photo-atmospheric-leiden-068-clp-16x20', expected: 2250, raise: false },
  { variantId: 'photo-atmospheric-leiden-068-gre-6x4-pack10', expected: 2800, raise: false },
  { variantId: 'photo-atmospheric-leiden-017-pos-6x4-pack10', expected: 2700, raise: false },
]

let pass = 0, fail = 0
for (const c of CASES) {
  const product = getVariantForCheckout(c.variantId)
  if (!product) {
    console.log(`FAIL ${c.variantId}: not found`)
    fail++; continue
  }
  if (product.price_cents !== c.expected) {
    console.log(`FAIL ${c.variantId}: price_cents=${product.price_cents} expected=${c.expected}`)
    fail++; continue
  }
  const okCorrect = verifyPrice(product, c.expected).ok
  if (!okCorrect) {
    console.log(`FAIL ${c.variantId}: verifyPrice rejected correct price ${c.expected}`)
    fail++; continue
  }
  if (c.raise) {
    const okOld = verifyPrice(product, c.prePrice).ok
    if (okOld) {
      console.log(`FAIL ${c.variantId}: verifyPrice accepted PRE-fix price ${c.prePrice}`)
      fail++; continue
    }
  }
  console.log(`OK   ${c.variantId.padEnd(50)} pc=${product.price_cents}`)
  pass++
}

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)
