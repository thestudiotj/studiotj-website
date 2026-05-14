import { convertEurCentsToDisplay, type Currency } from '@/lib/i18n/currency'

const LOCALE_BY_CURRENCY: Record<Currency, string> = {
  EUR: 'nl-NL',
  GBP: 'en-GB',
  USD: 'en-US',
  AUD: 'en-AU',
}

export function formatPrice(cents: number, currency: Currency = 'EUR'): string {
  const displayCents = convertEurCentsToDisplay(cents, currency)
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: 'currency',
    currency,
  }).format(displayCents / 100)
}
