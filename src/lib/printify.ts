const BASE_URL = 'https://api.printify.com/v1'

type FetchOptions = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] }
}

async function printifyFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = process.env.PRINTIFY_API_TOKEN
  const shopId = process.env.PRINTIFY_SHOP_ID

  if (!token || !shopId) {
    throw new Error('PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID must be set')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Printify ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrintifyImage {
  src: string
  variant_ids: number[]
  position: string
  is_default: boolean
}

export interface PrintifyVariant {
  id: number
  sku: string
  cost: number    // production cost in cents
  price: number   // retail price in cents
  title: string
  grams: number
  is_enabled: boolean
  is_default: boolean
  is_available: boolean
  options: number[]
}

export interface PrintifyOptionValue {
  id: number
  title: string
}

export interface PrintifyOption {
  name: string
  type: string
  values: PrintifyOptionValue[]
}

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  tags: string[]
  images: PrintifyImage[]
  variants: PrintifyVariant[]
  options: PrintifyOption[]
  visible: boolean
}

interface PrintifyProductsResponse {
  current_page: number
  data: PrintifyProduct[]
  last_page: number
  per_page: number
  total: number
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<PrintifyProduct[]> {
  const shopId = process.env.PRINTIFY_SHOP_ID
  const url = `${BASE_URL}/shops/${shopId}/products.json?limit=100`
  console.log('[printify] getProducts fetching:', url)
  try {
    const data = await printifyFetch<PrintifyProductsResponse>(
      `/shops/${shopId}/products.json?limit=100`,
      { next: { revalidate: 300 } }
    )
    console.log('[printify] getProducts response status: ok, total products:', data.data.length)
    const visible = data.data.filter((p) => p.visible)
    console.log('[printify] getProducts visible products:', visible.length)
    return visible
  } catch (err) {
    console.error('[printify] getProducts error:', err)
    throw err
  }
}

export async function getProductById(id: string): Promise<PrintifyProduct | null> {
  const shopId = process.env.PRINTIFY_SHOP_ID
  try {
    return await printifyFetch<PrintifyProduct>(
      `/shops/${shopId}/products/${id}.json`,
      { next: { revalidate: 300 } }
    )
  } catch {
    return null
  }
}

export async function submitOrderToPrintify(order: {
  external_id: string
  label: string
  line_items: { product_id: string; variant_id: number; quantity: number }[]
  shipping_method: number
  send_shipping_notification: boolean
  address_to: {
    first_name: string
    last_name: string
    email: string
    phone: string
    country: string
    region: string
    address1: string
    address2?: string
    city: string
    zip: string
  }
}) {
  const shopId = process.env.PRINTIFY_SHOP_ID
  return printifyFetch(`/shops/${shopId}/orders.json`, {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getEnabledVariants(product: PrintifyProduct): PrintifyVariant[] {
  return product.variants.filter((v) => v.is_enabled && v.is_available)
}

export function getPriceRange(product: PrintifyProduct): { min: number; max: number } {
  const variants = getEnabledVariants(product)
  const prices = (variants.length > 0 ? variants : product.variants).map((v) => v.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** cents → "€24.99" */
export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function getDefaultImage(product: PrintifyProduct): PrintifyImage | null {
  return product.images.find((img) => img.is_default) ?? product.images[0] ?? null
}
