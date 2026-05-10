export const runtime = 'nodejs'

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { sendOrderShipped, sendAdminAlert } from '@/lib/email'
import type { TrackingPresentation } from '@/emails/OrderShipped'

// ── Stripe client ──────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key)
}

function isStripeNotFound(err: unknown): boolean {
  return (
    err instanceof Stripe.errors.StripeInvalidRequestError &&
    err.statusCode === 404
  )
}

// ── Logging ────────────────────────────────────────────────────────────────────

function slog(fields: Record<string, unknown>): void {
  console.log(JSON.stringify(fields))
}

// ── Callback payload schema ────────────────────────────────────────────────────

const ShipmentSchema = z.object({
  id: z.string(),
  status: z.string(),
  carrier: z
    .object({
      name: z.string().optional(),
      service: z.string().optional(),
    })
    .optional(),
  tracking: z
    .object({
      number: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
})

const CallbackEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    order: z.object({
      id: z.string().optional().default(''),
      merchantReference: z.string(),
      recipient: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
      shipments: z.array(ShipmentSchema),
    }),
  }),
})

type ProdigiCallbackEvent = z.infer<typeof CallbackEventSchema>
type ProdigiCallbackShipment = z.infer<typeof ShipmentSchema>

// ── Tracking helper ────────────────────────────────────────────────────────────

function buildTracking(shipment: ProdigiCallbackShipment): TrackingPresentation {
  const carrier = shipment.carrier?.name ?? 'Unknown carrier'
  const service = shipment.carrier?.service ?? ''
  const url = shipment.tracking?.url
  const number = shipment.tracking?.number

  if (url) return { kind: 'url', url, carrier, service }
  if (number) return { kind: 'number', number, carrier, service }
  return { kind: 'none', carrier, service }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  const source_ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const url = new URL(request.url)
  const supplied = url.searchParams.get('token')
  const expected = process.env.PRODIGI_WEBHOOK_SECRET

  if (!expected) {
    slog({ phase: 'callback.auth', detail: 'missing_env', event_id: null })
    return new Response('Unauthorized', { status: 401 })
  }
  if (!supplied) {
    slog({ phase: 'callback.auth', detail: 'no_token', source_ip })
    return new Response('Unauthorized', { status: 401 })
  }
  const a = Buffer.from(supplied)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    slog({ phase: 'callback.auth', detail: 'mismatch', source_ip })
    return new Response('Unauthorized', { status: 401 })
  }

  // ── Parse ─────────────────────────────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    slog({ phase: 'callback.parse', detail: 'parse_failed', event_id: null })
    return new Response('Bad Request', { status: 400 })
  }

  const parsed = CallbackEventSchema.safeParse(rawBody)
  if (!parsed.success) {
    slog({
      phase: 'callback.parse',
      detail: 'validation_failed',
      event_id: null,
      issues: parsed.error.issues.map(i => i.message),
    })
    return new Response('Bad Request', { status: 400 })
  }

  const event: ProdigiCallbackEvent = parsed.data

  slog({
    phase: 'callback.received',
    event_id: event.id,
    event_type: event.type,
    prodigi_order_id: event.data.order.id,
    merchant_reference: event.data.order.merchantReference,
    shipments_count: event.data.order.shipments.length,
  })

  const merchantReference = event.data.order.merchantReference
  const stripe = getStripe()

  // ── Stripe session lookup ─────────────────────────────────────────────────────
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(merchantReference)
  } catch (err) {
    if (isStripeNotFound(err)) {
      slog({
        phase: 'callback.stripe',
        detail: 'session_not_found',
        merchant_reference: merchantReference,
        event_id: event.id,
      })
      sendAdminAlert({
        subject: 'Prodigi callback for unknown Stripe session',
        body: `merchantReference '${merchantReference}' did not resolve. Event ${event.id}, type ${event.type}.`,
      }).catch(alertErr =>
        slog({ phase: 'callback.admin_alert_failed', event_id: event.id, error: String(alertErr) }),
      )
      return new Response('OK', { status: 200 })
    }
    slog({
      phase: 'callback.stripe',
      detail: 'transient_error',
      error: String(err),
      event_id: event.id,
    })
    return new Response('Service Unavailable', { status: 503 })
  }

  // ── Shipment dedup ────────────────────────────────────────────────────────────
  let previouslyNotified: string[]
  const rawNotified = session.metadata?.prodigi_shipments_notified

  try {
    const parsedMeta = JSON.parse(rawNotified ?? '[]')
    if (!Array.isArray(parsedMeta)) {
      slog({ phase: 'callback.dedup', detail: 'corrupt_metadata_not_array', event_id: event.id })
      previouslyNotified = []
    } else {
      previouslyNotified = parsedMeta as string[]
    }
  } catch {
    slog({ phase: 'callback.dedup', detail: 'corrupt_metadata_parse_error', event_id: event.id })
    previouslyNotified = []
  }

  const shippedShipments = event.data.order.shipments.filter(s => s.status === 'Shipped')
  const newShipments = shippedShipments.filter(s => !previouslyNotified.includes(s.id))

  if (newShipments.length === 0) {
    slog({
      phase: 'callback.no_new_shipments',
      event_id: event.id,
      event_type: event.type,
      shipments_total: shippedShipments.length,
      previously_notified: previouslyNotified.length,
    })
    return new Response('OK', { status: 200 })
  }

  // ── Send emails ───────────────────────────────────────────────────────────────
  const orderRef = merchantReference.slice(-8).toUpperCase()
  const totalShipments = event.data.order.shipments.length
  const recipientEmail =
    session.customer_details?.email ?? event.data.order.recipient?.email ?? ''
  const recipientName =
    session.customer_details?.name ?? event.data.order.recipient?.name ?? ''

  const successfullyNotified: string[] = []

  for (const shipment of newShipments) {
    const indexInOrder = event.data.order.shipments.findIndex(s => s.id === shipment.id)
    const tracking = buildTracking(shipment)

    let result: Awaited<ReturnType<typeof sendOrderShipped>>
    try {
      result = await sendOrderShipped(recipientEmail, {
        customerName: recipientName,
        orderRef,
        tracking,
        shipmentIndex: totalShipments > 1 ? indexInOrder + 1 : undefined,
        totalShipments: totalShipments > 1 ? totalShipments : undefined,
      })
    } catch (err) {
      slog({
        phase: 'callback.resend',
        detail: 'transient_fail',
        shipment_id: shipment.id,
        error: String(err),
        event_id: event.id,
      })
      return new Response('Service Unavailable', { status: 503 })
    }

    if (result.error) {
      const statusCode = result.error.statusCode
      const isHardFail =
        typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500

      if (isHardFail) {
        slog({
          phase: 'callback.resend',
          detail: 'hard_fail',
          shipment_id: shipment.id,
          status_code: statusCode,
          event_id: event.id,
        })
        successfullyNotified.push(shipment.id)
        sendAdminAlert({
          subject: `[StudioTJ] Resend hard fail for shipment ${shipment.id}`,
          body: `Order ${merchantReference}, shipment ${shipment.id}: Resend ${statusCode} — ${result.error.message}`,
        }).catch(() => {})
      } else {
        slog({
          phase: 'callback.resend',
          detail: 'transient_fail',
          shipment_id: shipment.id,
          status_code: statusCode,
          event_id: event.id,
        })
        return new Response('Service Unavailable', { status: 503 })
      }
    } else {
      slog({
        phase: 'callback.resend',
        detail: 'sent',
        shipment_id: shipment.id,
        event_id: event.id,
      })
      successfullyNotified.push(shipment.id)
    }
  }

  // ── Stripe metadata write ─────────────────────────────────────────────────────
  const updatedNotified = [...previouslyNotified, ...successfullyNotified]

  try {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...(session.metadata ?? {}),
        prodigi_shipments_notified: JSON.stringify(updatedNotified),
        prodigi_last_callback_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    slog({
      phase: 'callback.stripe',
      detail: 'metadata_write_failed',
      error: String(err),
      event_id: event.id,
    })
    return new Response('Service Unavailable', { status: 503 })
  }

  slog({
    phase: 'callback.complete',
    event_id: event.id,
    event_type: event.type,
    prodigi_order_id: event.data.order.id,
    merchant_reference: merchantReference,
    shipments_total: event.data.order.shipments.length,
    shipments_shipped: shippedShipments.length,
    emailed: successfullyNotified.length,
  })

  return new Response('OK', { status: 200 })
}
