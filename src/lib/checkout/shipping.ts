import { createQuote, ProdigiApiError } from '@/lib/prodigi'
import type {
  ProdigiQuoteRequest,
  ProdigiQuoteResponse,
  ShippingMethod,
  ISO2,
} from '@/lib/prodigi'
import { resolveSku } from '@/lib/prodigi'
import type { Product } from '@/lib/catalogue'

const FALLBACK_SHIPPING_CENTS = 2500
const FALLBACK_DELIVERY_MIN = 5
const FALLBACK_DELIVERY_MAX = 14

export interface ShippingResolution {
  amountCents: number
  deliveryMinDays: number
  deliveryMaxDays: number
  source: 'quote' | 'fallback'
  quoteOutcome?: string
}

export async function resolveShipping(
  items: Array<{ product: Product; copies: number }>,
  destinationCountry: ISO2,
  method: ShippingMethod = 'Standard',
): Promise<ShippingResolution> {
  const quoteRequest: ProdigiQuoteRequest = {
    shippingMethod: method,
    destinationCountryCode: destinationCountry.toUpperCase(),
    currencyCode: 'EUR',
    items: items.map(({ product, copies }) => ({
      sku: resolveSku(product, destinationCountry),
      copies,
      attributes: {},
      assets: [{ printArea: 'default' }],
    })),
  }

  try {
    return await callQuoteWithRetry(quoteRequest)
  } catch (err) {
    console.error('[checkout/shipping] Quote failed twice, falling back', {
      error: err instanceof Error ? err.message : String(err),
      destinationCountry,
      itemCount: items.length,
    })
    return {
      amountCents: FALLBACK_SHIPPING_CENTS,
      deliveryMinDays: FALLBACK_DELIVERY_MIN,
      deliveryMaxDays: FALLBACK_DELIVERY_MAX,
      source: 'fallback',
    }
  }
}

async function callQuoteWithRetry(req: ProdigiQuoteRequest): Promise<ShippingResolution> {
  try {
    return parseQuoteResponse(await createQuote(req))
  } catch (err) {
    if (err instanceof ProdigiApiError && err.isTransient) {
      return parseQuoteResponse(await createQuote(req))
    }
    throw err
  }
}

function parseQuoteResponse(res: ProdigiQuoteResponse): ShippingResolution {
  if (res.outcome === 'CreatedWithIssues' || res.quotes.length === 0) {
    if (res.quotes.length === 0) {
      throw new Error(`Quote outcome=${res.outcome}, no usable quote`)
    }
  }

  const quote = res.quotes[0]
  const shippingAmount = parseFloat(quote.costSummary.shipping.amount)
  if (!Number.isFinite(shippingAmount) || shippingAmount < 0) {
    throw new Error(`Quote returned invalid shipping amount: ${quote.costSummary.shipping.amount}`)
  }

  return {
    amountCents: Math.round(shippingAmount * 100),
    deliveryMinDays: 5,
    deliveryMaxDays: 10,
    source: 'quote',
    quoteOutcome: res.outcome,
  }
}

export function getRequestCountry(headers: Headers): ISO2 {
  return (headers.get('x-vercel-ip-country') ?? 'NL').toUpperCase()
}
