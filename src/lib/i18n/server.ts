import { headers } from 'next/headers'
import { resolveCurrency, type Currency } from './currency'

/** Resolve the visitor's display currency from the Vercel edge geo header.
 *  Falls back to EUR when the header is absent (local dev, scrapers).
 *
 *  Local-dev override: set DEV_VISITOR_COUNTRY (e.g. 'GB', 'US', 'AU', 'NL') in
 *  .env.local to test non-EUR rendering without a VPN. The override is ignored
 *  in production. */
export async function getVisitorCurrency(): Promise<Currency> {
  const devOverride =
    process.env.NODE_ENV !== 'production' ? process.env.DEV_VISITOR_COUNTRY : undefined
  if (devOverride) return resolveCurrency(devOverride)

  const country = headers().get('x-vercel-ip-country') ?? undefined
  return resolveCurrency(country)
}
