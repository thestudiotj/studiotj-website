import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProductById } from '@/lib/printify'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key)
}

interface CartItemInput {
  productId: string
  variantId: number
  quantity: number
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  // ── Parse & validate input ────────────────────────────────────────────────
  let items: CartItemInput[]

  try {
    const body = await req.json()
    if (!Array.isArray(body.items) || body.items.length === 0) throw new Error()
    items = body.items.map((i: any) => ({
      productId: String(i.productId ?? ''),
      variantId: Number(i.variantId),
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
    }))
    if (items.some((i) => !i.productId || !i.variantId)) throw new Error()
  } catch {
    return NextResponse.json(
      { error: 'items must be a non-empty array of {productId, variantId, quantity}' },
      { status: 400 }
    )
  }

  // ── Resolve site origin ───────────────────────────────────────────────────
  const origin =
    process.env.SITE_URL ??
    req.headers.get('origin') ??
    'http://localhost:3000'

  // ── Build Stripe line items ───────────────────────────────────────────────
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  // Store all product/variant pairs for the webhook
  const metaPairs: string[] = []

  for (const { productId, variantId, quantity } of items) {
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 })
    }

    const variant = product.variants.find((v) => v.id === variantId)
    if (!variant || !variant.is_enabled) {
      return NextResponse.json(
        { error: `Variant not found or unavailable: ${variantId}` },
        { status: 404 }
      )
    }

    const image =
      product.images.find((img) => img.variant_ids.includes(variant.id)) ??
      product.images.find((img) => img.is_default) ??
      product.images[0] ??
      null

    lineItems.push({
      price_data: {
        currency: 'eur',
        unit_amount: variant.price,
        product_data: {
          name:
            product.options.length > 0
              ? `${product.title} — ${variant.title}`
              : product.title,
          description: product.description
            ? product.description.replace(/<[^>]+>/g, '').slice(0, 500)
            : undefined,
          images: image ? [image.src] : [],
          metadata: {
            printify_product_id: productId,
            printify_variant_id: String(variantId),
          },
        },
      },
      quantity,
    })

    metaPairs.push(`${productId}:${variantId}:${quantity}`)
  }

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,

    shipping_address_collection: {
      allowed_countries: [
        'NL', 'BE', 'DE', 'FR', 'GB', 'IT', 'ES', 'AT', 'CH', 'DK', 'SE',
        'NO', 'FI', 'PL', 'PT', 'IE', 'US', 'CA', 'AU', 'NZ', 'JP',
      ],
    },

    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 499, currency: 'eur' },
          display_name: 'Standard shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 5 },
            maximum: { unit: 'business_day', value: 10 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'eur' },
          display_name: 'Free shipping (orders over €75)',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 7 },
            maximum: { unit: 'business_day', value: 14 },
          },
        },
      },
    ],

    // Encode all items as "productId:variantId:qty" joined by "|" for the webhook
    metadata: {
      order_items: metaPairs.join('|'),
    },

    success_url: `${origin}/shop/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  })

  return NextResponse.json({ url: session.url })
}
