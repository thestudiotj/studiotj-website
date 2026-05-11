import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getVariantForCheckout } from '@/lib/catalogue'
import type { CheckoutProduct } from '@/lib/catalogue'
import { verifyPrice } from '@/lib/checkout/pricing'
import { resolveShipping, getRequestCountry } from '@/lib/checkout/shipping'
import { imageUrl } from '@/lib/checkout/images'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key)
}

interface CartItemInput {
  productId: string
  price: number        // cents — geo-computed at add-to-cart on product page
  quantity: number
}

const ALLOWED_COUNTRIES = [
  'NL', 'BE', 'DE', 'FR', 'GB', 'IT', 'ES', 'AT', 'CH', 'DK', 'SE',
  'NO', 'FI', 'PL', 'PT', 'IE', 'US', 'CA', 'AU', 'NZ', 'JP',
] as const

export async function POST(req: NextRequest) {
  const stripe = getStripe()

  // ── Parse & validate input ─────────────────────────────────────────────
  let items: CartItemInput[]
  try {
    const body = await req.json()
    if (!Array.isArray(body.items) || body.items.length === 0) throw new Error()
    items = body.items.map((i: any) => ({
      productId: String(i.productId ?? ''),
      price: Math.floor(Number(i.price)),
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
    }))
    if (items.some((i) => !i.productId || !Number.isFinite(i.price) || i.price <= 0)) {
      throw new Error()
    }
  } catch {
    return NextResponse.json(
      { error: 'items must be a non-empty array of {productId, price, quantity}' },
      { status: 400 },
    )
  }

  // ── Resolve products from catalogue ─────────────────────────────────────
  const resolvedItems: Array<{
    product: CheckoutProduct
    price: number
    quantity: number
  }> = []

  for (const { productId, price, quantity } of items) {
    const product = getVariantForCheckout(productId)
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 })
    }
    if (!product.available) {
      return NextResponse.json({ error: `Product unavailable: ${productId}` }, { status: 404 })
    }

    if (!product.print_areas[0]?.default_asset_r2) {
      return NextResponse.json(
        { error: `Catalogue authoring error: missing print_areas[0].default_asset_r2 for ${productId}` },
        { status: 500 },
      )
    }

    const bounds = verifyPrice(product, price)
    if (bounds.expected.length > 0 && !bounds.ok) {
      console.warn('[checkout] Price bounds rejection', {
        productId,
        received: bounds.received,
        expected: bounds.expected,
      })
      return NextResponse.json(
        { error: `Invalid price for product: ${productId}` },
        { status: 400 },
      )
    }
    if (bounds.expected.length === 0) {
      console.warn('[checkout] Price bounds skipped (no base prices in catalogue)', { productId })
    }

    resolvedItems.push({ product, price, quantity })
  }

  // ── Resolve shipping via Prodigi Quote ──────────────────────────────────
  const country = getRequestCountry(req.headers)
  const shipping = await resolveShipping(
    resolvedItems.map(({ product, quantity }) => ({
      product,
      copies: quantity,
    })),
    country,
  )

  if (shipping.source === 'fallback') {
    console.warn('[checkout] Shipping fell back to flat rate', {
      country,
      itemCount: resolvedItems.length,
    })
  }

  // ── Resolve site origin ─────────────────────────────────────────────────
  const origin =
    process.env.SITE_URL ?? req.headers.get('origin') ?? 'http://localhost:3000'

  // ── Build Stripe line items ─────────────────────────────────────────────
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  const metaPairs: string[] = []

  for (const { product, price, quantity } of resolvedItems) {
    const heroPath = product.print_areas[0].default_asset_r2
    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: price,
        product_data: {
          name: product.title,
          description: product.description.slice(0, 500),
          images: [imageUrl(heroPath)],
          metadata: {
            studiotj_product_id: product.id,
            studiotj_product_type: product.type,
          },
        },
      },
      quantity,
    })
    metaPairs.push(`${product.id}:${quantity}`)
  }

  // ── Create Stripe Checkout Session ──────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,

    shipping_address_collection: {
      allowed_countries: [...ALLOWED_COUNTRIES] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection['allowed_countries'],
    },

    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shipping.amountCents, currency: 'eur' },
          display_name: 'Standard shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: shipping.deliveryMinDays },
            maximum: { unit: 'business_day', value: shipping.deliveryMaxDays },
          },
        },
      },
    ],

    metadata: {
      order_items: metaPairs.join('|'),
      shipping_source: shipping.source,
      ip_country: country,
    },

    success_url: `${origin}/shop/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  })

  return NextResponse.json({ url: session.url })
}
