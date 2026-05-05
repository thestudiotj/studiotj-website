import type { ISO2, Lab } from './types'

export const DEFAULT_FALLBACK_LAB: Lab = 'US'

// 27 EU member states + UK + US. Extend as Prodigi labs expand.
export const COUNTRY_TO_LAB: Record<string, Lab> = {
  // EU 27
  AT: 'EU', BE: 'EU', BG: 'EU', HR: 'EU', CY: 'EU', CZ: 'EU', DK: 'EU',
  EE: 'EU', FI: 'EU', FR: 'EU', DE: 'EU', GR: 'EU', HU: 'EU', IE: 'EU',
  IT: 'EU', LV: 'EU', LT: 'EU', LU: 'EU', MT: 'EU', NL: 'EU', PL: 'EU',
  PT: 'EU', RO: 'EU', SK: 'EU', SI: 'EU', ES: 'EU', SE: 'EU',
  // UK
  GB: 'UK',
  // US
  US: 'US',
}

export function resolveLab(country: ISO2): Lab {
  return COUNTRY_TO_LAB[country.toUpperCase()] ?? DEFAULT_FALLBACK_LAB
}

interface SkuResolvable {
  prodigi_sku?: string
  regional_skus?: Partial<Record<Lab, string>>
}

export function resolveSku(product: SkuResolvable, country: ISO2): string {
  const lab = resolveLab(country)
  if (product.regional_skus?.[lab]) return product.regional_skus[lab]!
  if (product.prodigi_sku) return product.prodigi_sku
  throw new Error(
    `No SKU resolvable for country=${country} (lab=${lab}). Product must have either prodigi_sku or regional_skus[${lab}].`,
  )
}
