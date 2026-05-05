import type {
  ProdigiOrderRequest,
  ProdigiOrderResponse,
  ProdigiQuoteRequest,
  ProdigiQuoteResponse,
} from './types'

const SANDBOX_BASE_URL = 'https://api.sandbox.prodigi.com'
const LIVE_BASE_URL = 'https://api.prodigi.com'

function getBaseUrl(): string {
  return process.env.PRODIGI_SANDBOX === 'true' ? SANDBOX_BASE_URL : LIVE_BASE_URL
}

function getApiKey(): string {
  const key = process.env.PRODIGI_API_KEY
  if (!key) throw new Error('PRODIGI_API_KEY is not set')
  return key
}

async function prodigiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}/v4.0${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'X-API-Key': getApiKey(),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const body = await res.text()
  if (!res.ok) {
    throw new ProdigiApiError(res.status, body, path)
  }
  return JSON.parse(body) as T
}

export class ProdigiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly path: string,
  ) {
    super(`Prodigi API error ${status} on ${path}: ${body}`)
    this.name = 'ProdigiApiError'
  }

  /** True for transient failures Stripe should retry (5xx, 429). */
  get isTransient(): boolean {
    return this.status >= 500 || this.status === 429
  }
}

export async function createOrder(request: ProdigiOrderRequest): Promise<ProdigiOrderResponse> {
  return prodigiFetch<ProdigiOrderResponse>('/Orders', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function createQuote(request: ProdigiQuoteRequest): Promise<ProdigiQuoteResponse> {
  return prodigiFetch<ProdigiQuoteResponse>('/quotes', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function getOrder(orderId: string): Promise<ProdigiOrderResponse> {
  return prodigiFetch<ProdigiOrderResponse>(`/Orders/${orderId}`)
}
