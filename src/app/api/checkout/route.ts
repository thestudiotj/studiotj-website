import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProductById } from '@/lib/printify'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  // ── Parse & validate input ────────────────────────────────────────────────
  let productId: string
  let variantId: number

  try {
    const body = await req.json()
    productId = String(body.productId ?? '')
    variantId = Number(body.variantId)
    if (!productId || !variantId) throw new Error()
  } catch {
    return NextResponse.json(
      { error: 'productId (string) and variantId (number) are required' },
      { status: 400 }
    )
  }

  // ── Fetch product from Printify ───────────────────────────────────────────
  const product = await getProductById(productId)
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const variant = product.variants.find((v) => v.id === variantId)
  if (!variant || !variant.is_enabled || !variant.is_available) {
    return NextResponse.json(
      { error: 'Variant not found or unavailable' },
      { status: 404 }
    )
  }

  // ── Pick the best image for the checkout page ─────────────────────────────
  const image =
    product.images.find((img) => img.variant_ids.includes(variant.id)) ??
    product.images.find((img) => img.is_default) ??
    product.images[0] ??
    null

  // ── Resolve site origin ───────────────────────────────────────────────────
  // Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://studiotj.nl)
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get('origin') ??
    'http://localhost:3000'

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',

    line_items: [
      {
        price_data: {
          currency: 'eur',
          // Printify prices are already in cents
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
        quantity: 1,
      },
    ],

    // Collect shipping address — passed to Printify in the webhook
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

    // Passed to the webhook so we know what to order from Printify
    metadata: {
      printify_product_id: productId,
      printify_variant_id: String(variantId),
    },

    // Collect email for Printify shipping notification
    customer_email: undefined, // Stripe collects this automatically

    success_url: `${origin}/shop/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/${productId}`,
  })

  return NextResponse.json({ url: session.url })
}
