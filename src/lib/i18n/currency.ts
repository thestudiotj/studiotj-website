import { COUNTRY_TO_LAB } from '@/lib/prodigi/routing'

export type Currency = 'EUR' | 'GBP' | 'USD' | 'AUD'

export const CURRENCIES = ['EUR', 'GBP', 'USD', 'AUD'] as const

/** ECB daily rates locked at 2026-05-13 (1 EUR = X). Source:
 *  scripts/extraction-fx-rates.md. Refresh by editing both files together. */
export const ECB_RATES_2026_05_13: Record<Currency, number> = {
  EUR: 1,
  GBP: 0.86713,
  USD: 1.1715,
  AUD: 1.6158,
}

/** Upward buffer applied to non-EUR display rates to absorb Stripe's 2–4%
 *  Adaptive Pricing markup. Display price stays ≥ Stripe-converted amount. */
export const FX_BUFFER = 1.04

export const FX_DISPLAY_RATES: Record<Currency, number> = {
  EUR: 1,
  GBP: ECB_RATES_2026_05_13.GBP * FX_BUFFER,
  USD: ECB_RATES_2026_05_13.USD * FX_BUFFER,
  AUD: ECB_RATES_2026_05_13.AUD * FX_BUFFER,
}

/** Country → display currency. EU member states (anything mapping to lab 'EU'
 *  in routing) → EUR; UK → GBP; US → USD; AU → AUD. Everywhere else → EUR. */
export const COUNTRY_TO_CURRENCY: Record<string, Currency> = (() => {
  const out: Record<string, Currency> = {}
  for (const [country, lab] of Object.entries(COUNTRY_TO_LAB)) {
    if (lab === 'EU') out[country] = 'EUR'
  }
  out.GB = 'GBP'
  out.US = 'USD'
  out.AU = 'AUD'
  return out
})()

export function resolveCurrency(country: string | undefined): Currency {
  if (!country) return 'EUR'
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? 'EUR'
}

export function convertEurCentsToDisplay(eurCents: number, currency: Currency): number {
  return Math.round(eurCents * FX_DISPLAY_RATES[currency])
}
