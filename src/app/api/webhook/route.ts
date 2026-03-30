import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { submitOrderToPrintify } from '@/lib/printify'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/)
  const first_name = parts[0] ?? ''
  const last_name = parts.slice(1).join(' ') || first_name
  return { first_name, last_name }
}

// ── Route handler ─────────────────────────────────────────────────────────────

// App Router does NOT auto-parse the body, so req.text() gives us the raw bytes
// needed for Stripe signature verification.
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // ── Verify signature ────────────────────────────────────────────────────
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()
  let event: Stripe.Event

  console.log('[webhook] body length:', rawBody.length)
  console.log('[webhook] signature header:', sig?.substring(0, 30))
  console.log('[webhook] secret prefix:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10))

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  // ── Handle events ───────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Only process sessions that resulted in a paid order
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const orderItemsRaw = session.metadata?.order_items
    if (!orderItemsRaw) {
      console.error('Missing order_items metadata on session', session.id)
      return NextResponse.json({ error: 'Missing product metadata' }, { status: 400 })
    }

    const line_items = orderItemsRaw.split('|').map((entry) => {
      const [productId, variantId, qty] = entry.split(':')
      return {
        product_id: productId,
        variant_id: Number(variantId),
        quantity: Number(qty) || 1,
      }
    })

    // ── Build shipping address ────────────────────────────────────────────
    // stripe@21: shipping address is under collected_information.shipping_details
    const shipping = session.collected_information?.shipping_details
    const customer = session.customer_details

    if (!shipping?.address || !shipping?.name) {
      console.error('No shipping address on session', session.id)
      return NextResponse.json({ error: 'No shipping address' }, { status: 400 })
    }

    const { first_name, last_name } = splitName(shipping.name)
    const addr = shipping.address

    // ── Submit to Printify ────────────────────────────────────────────────
    try {
      const order = await submitOrderToPrintify({
        external_id: session.id,              // Stripe session ID — traceable in both dashboards
        label: `Order ${session.id.slice(-8).toUpperCase()}`,
        line_items,
        shipping_method: 1,                   // 1 = standard shipping
        send_shipping_notification: true,     // Printify emails the customer when it ships
        address_to: {
          first_name,
          last_name,
          email: customer?.email ?? '',
          phone: customer?.phone ?? '',
          country: addr.country ?? '',
          region: addr.state ?? '',
          address1: addr.line1 ?? '',
          address2: addr.line2 ?? undefined,
          city: addr.city ?? '',
          zip: addr.postal_code ?? '',
        },
      })

      console.log('Printify order created:', order)
    } catch (err: any) {
      // Log the error but still return 200 so Stripe doesn't retry endlessly.
      // You'll see the failure in your server logs / Vercel log drain.
      console.error('Failed to submit order to Printify:', err.message)
    }
  }

  // Acknowledge all other event types so Stripe doesn't retry them
  return NextResponse.json({ received: true })
}
