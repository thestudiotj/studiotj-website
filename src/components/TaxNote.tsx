import type { Currency } from '@/lib/i18n/currency'

export function TaxNote({
  currency,
  className = 'text-xs text-muted',
}: {
  currency: Currency
  className?: string
}) {
  if (currency !== 'USD') return null
  return <span className={className}>+ tax at checkout</span>
}
