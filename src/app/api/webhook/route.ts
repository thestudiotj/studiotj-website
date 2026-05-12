export const runtime = "nodejs"

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createOrder, createQuote, ProdigiApiError, resolveSku } from '@/lib/prodigi'
import type { ISO2, ProdigiOrderRequest, ProdigiOrderResponse, ProdigiQuoteResponse } from '@/lib/prodigi'
import { getVariantForCheckout } from '@/lib/catalogue'
import { sendOrderReceived, sendOrderNeedsAttention, sendAdminAlert } from '@/lib/email'
import { imageUrl } from '@/lib/checkout/images'

// 'pending' is reserved for partial-failure recovery in future sessions;
// this handler always resolves to 'created' or 'needs_attention' before writing.
type ProdigiStatus = 'pending' | 'created' | 'needs_attention'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key)
}

interface ResolvedItem {
  product: NonNullable<ReturnType<typeof getVariantForCheckout>>
  quantity: number
  sku: string
}

function hasRegionalAssets(items: ResolvedItem[]): boolean {
  return items.some(item =>
    item.product.print_areas.some(area => area.regional_assets != null),
  )
}

async function maybeQuoteForLab(
  items: ResolvedItem[],
  country: string,
): Promise<ProdigiQuoteResponse | null> {
  if (!hasRegionalAssets(items)) return null
  return createQuote({
    shippingMethod: 'Standard',
    destinationCountryCode: country,
    currencyCode: 'EUR',
    items: items.map(({ sku, quantity, product }) => ({
      sku,
      copies: quantity,
      assets: product.print_areas.map(area => ({
        printArea: area.slot,
        ...(area.page_count != null ? { pageCount: area.page_count } : {}),
      })),
    })),
  })
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

function slog(fields: Record<string, unknown>): void {
  console.log(JSON.stringify(fields))
}

// ── Prodigi error classification ──────────────────────────────────────────────

interface ApiErrorClassification {
  prodigiOutcome: string | null
  action: 'stop_notify' | 'retry_notify' | 'retry_silent'
  metadataStatus: string
  suggestedFix?: string
}

function classifyApiError(err: ProdigiApiError): ApiErrorClassification {
  let prodigiOutcome: string | null = null
  try {
    const parsed = JSON.parse(err.body)
    if (typeof parsed?.outcome === 'string') prodigiOutcome = parsed.outcome
  } catch {}

  switch (prodigiOutcome) {
    case 'PaymentFailed':
      return {
        prodigiOutcome,
        action: 'retry_notify',
        metadataStatus: 'payment_failed',
        suggestedFix:
          'Stripe will continue retrying for up to 3 days. Top up your Prodigi billing balance within that window and the order auto-completes.',
      }
    case 'InvalidAddress':
      return {
        prodigiOutcome,
        action: 'stop_notify',
        metadataStatus: 'invalid_address',
        suggestedFix:
          'Contact the customer to verify their shipping address, then re-submit the order manually.',
      }
    case 'ValidationFailed':
      return {
        prodigiOutcome,
        action: 'stop_notify',
        metadataStatus: 'validation_failed',
        suggestedFix:
          'Order data is malformed. Check the Prodigi error details and correct the product configuration.',
      }
    default:
      return {
        prodigiOutcome,
        action: err.isTransient ? 'retry_silent' : 'stop_notify',
        metadataStatus: 'needs_attention',
      }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startMs = Date.now()
  const stripe = getStripe()

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Webhook signature error: ${msg}` }, { status: 400 })
  }

  // ── Phase 1: webhook.received ────────────────────────────────────────────
  const receivedSessionId =
    event.type === 'checkout.session.completed'
      ? (event.data.object as Stripe.Checkout.Session).id
      : null

  slog({
    phase: 'webhook.received',
    event_id: event.id,
    event_type: event.type,
    stripe_session_id: receivedSessionId,
    route: '/api/webhook',
  })

  // ── Phase 2: skip non-checkout events ───────────────────────────────────
  if (event.type !== 'checkout.session.completed') {
    slog({ phase: 'webhook.skipped', event_id: event.id, event_type: event.type })
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const sessionId = session.id

  // Skip sessions where payment isn't confirmed yet (e.g. bank transfer pending)
  if (session.payment_status !== 'paid') {
    slog({
      phase: 'webhook.skipped',
      event_id: event.id,
      event_type: event.type,
      stripe_session_id: sessionId,
      reason: 'payment_not_paid',
      payment_status: session.payment_status,
    })
    return NextResponse.json({ received: true })
  }

  // ── Step 3: parse order_items ────────────────────────────────────────────
  const orderItemsRaw = session.metadata?.order_items
  if (!orderItemsRaw) {
    return NextResponse.json({ error: 'Missing order_items metadata' }, { status: 400 })
  }

  const parsedItems = orderItemsRaw.split('|').flatMap(entry => {
    const [productId, qtyStr] = entry.split(':')
    if (!productId) return []
    return [{ productId, quantity: Number(qtyStr) || 1 }]
  })

  // ── Steps 4–5: load products, read context ───────────────────────────────
  const shipping = session.collected_information?.shipping_details
  const addr = shipping?.address
  const shippingName = shipping?.name ?? ''
  const customerEmail = session.customer_details?.email ?? ''
  const shipToCountry: ISO2 = addr?.country ?? 'NL'
  const ipCountryAtCheckout = session.metadata?.ip_country ?? 'unknown'

  // ── Phase 2b: refund guard ───────────────────────────────────────────────
  // Re-fetch the session with the payment intent's latest charge expanded so we
  // see the *current* refund state, not the state when the event was originally
  // fired. Stripe's up-to-3-day retry window means a charge refunded after a
  // failed delivery can still reach this handler on a later retry attempt.
  let refundGuardCharge: Stripe.Charge | null = null
  try {
    const expandedSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    })
    const pi = expandedSession.payment_intent
    if (pi && typeof pi !== 'string' && pi.latest_charge && typeof pi.latest_charge !== 'string') {
      refundGuardCharge = pi.latest_charge
    }
  } catch (expandErr: unknown) {
    slog({
      phase: 'webhook.expand_error',
      event_id: event.id,
      stripe_session_id: sessionId,
      error_message: expandErr instanceof Error ? expandErr.message : String(expandErr),
    })
    return NextResponse.json({ error: 'Could not retrieve session details' }, { status: 503 })
  }

  if (refundGuardCharge && (refundGuardCharge.refunded || refundGuardCharge.amount_refunded > 0)) {
    const charge = refundGuardCharge
    const refundedAtMs = charge.refunds?.data[0]?.created
      ? charge.refunds.data[0].created * 1000
      : null
    const refundedAtStr = refundedAtMs ? new Date(refundedAtMs).toISOString() : 'unknown'

    slog({
      phase: 'webhook.refund_guard',
      event_id: event.id,
      stripe_session_id: sessionId,
      charge_id: charge.id,
      refunded: charge.refunded,
      amount_refunded: charge.amount_refunded,
      action: 'skipped_refunded',
    })

    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: { prodigi_status: 'skipped_refunded' },
      })
      slog({
        phase: 'webhook.metadata_written',
        event_id: event.id,
        stripe_session_id: sessionId,
        prodigi_status: 'skipped_refunded',
      })
    } catch (metaErr: unknown) {
      slog({
        phase: 'webhook.metadata_error',
        event_id: event.id,
        stripe_session_id: sessionId,
        error_message: metaErr instanceof Error ? metaErr.message : String(metaErr),
      })
    }

    const currency = session.currency ?? 'eur'
    const itemsSummary = parsedItems
      .map(({ productId, quantity }) => `  ${productId} × ${quantity}`)
      .join('\n')
    try {
      await sendAdminAlert({
        subject: '[StudioTJ] Order skipped — Stripe charge was refunded',
        body: [
          `Stripe session: ${sessionId}`,
          `Customer: ${customerEmail}`,
          `Total charged: ${formatCents(session.amount_total ?? 0, currency)}`,
          `Refund amount: ${formatCents(charge.amount_refunded, currency)}`,
          `Refunded at: ${refundedAtStr}`,
          `Items ordered:\n${itemsSummary}`,
          '',
          'This Stripe charge was refunded before our webhook successfully processed it.',
          'No Prodigi order was created. No further action needed.',
        ].join('\n'),
      })
      slog({
        phase: 'webhook.resend_sent',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'AdminAlert:skipped_refunded',
      })
    } catch (alertErr: unknown) {
      slog({
        phase: 'webhook.resend_failed',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'AdminAlert:skipped_refunded',
        error_message: alertErr instanceof Error ? alertErr.message : String(alertErr),
      })
    }

    slog({
      phase: 'webhook.complete',
      event_id: event.id,
      stripe_session_id: sessionId,
      prodigi_status: 'skipped_refunded',
      returned_status_code: 200,
      duration_ms: Date.now() - startMs,
      ip_country_at_checkout: ipCountryAtCheckout,
      ship_to_country: shipToCountry,
    })
    return NextResponse.json({ received: true })
  }

  // ── Step 6: resolve SKUs ─────────────────────────────────────────────────
  const resolvedItems: ResolvedItem[] = []

  for (const { productId, quantity } of parsedItems) {
    const product = getVariantForCheckout(productId)
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 400 })
    }
    let sku: string
    try {
      sku = resolveSku(product, shipToCountry)
    } catch (err: unknown) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'SKU resolution failed' },
        { status: 400 },
      )
    }
    resolvedItems.push({ product, quantity, sku })
  }

  // ── Step 7: conditional quote (always null for v1 catalogue) ─────────────
  let quote: ProdigiQuoteResponse | null = null
  try {
    quote = await maybeQuoteForLab(resolvedItems, shipToCountry)
  } catch (err: unknown) {
    slog({
      phase: 'webhook.quote_error',
      event_id: event.id,
      stripe_session_id: sessionId,
      error_message: err instanceof Error ? err.message : String(err),
    })
  }
  const attemptedQuote = quote !== null

  // ── Steps 8–9: build Prodigi order request ───────────────────────────────
  const orderRequest: ProdigiOrderRequest = {
    merchantReference: sessionId,
    idempotencyKey: event.id,
    shippingMethod: 'Standard',
    recipient: {
      name: shippingName,
      ...(customerEmail ? { email: customerEmail } : {}),
      address: {
        line1: addr?.line1 ?? '',
        ...(addr?.line2 ? { line2: addr.line2 } : {}),
        postalOrZipCode: addr?.postal_code ?? '',
        countryCode: shipToCountry,
        townOrCity: addr?.city ?? '',
        ...(addr?.state ? { stateOrCounty: addr.state } : {}),
      },
    },
    items: resolvedItems.map(({ sku, quantity, product }) => ({
      sku,
      copies: quantity,
      sizing: 'fillPrintArea' as const,
      ...(product.prodigi_attributes ? { attributes: product.prodigi_attributes } : {}),
      assets: product.print_areas.map(area => ({
        printArea: area.slot,
        url: imageUrl(area.default_asset_r2),
        ...(area.page_count != null ? { pageCount: area.page_count } : {}),
      })),
    })),
  }

  // ── Step 10: POST to Prodigi /v4.0/Orders ────────────────────────────────
  let prodigiResponse: ProdigiOrderResponse
  let outcome: ProdigiOrderResponse['outcome']
  let prodigiOrderId: string | null = null

  try {
    prodigiResponse = await createOrder(orderRequest)
    outcome = prodigiResponse.outcome
    prodigiOrderId = prodigiResponse.order?.id ?? null
  } catch (err: unknown) {
    if (!(err instanceof ProdigiApiError)) {
      slog({
        phase: 'webhook.prodigi_error',
        event_id: event.id,
        stripe_session_id: sessionId,
        error_category: 'unknown',
        error_message: err instanceof Error ? err.message : String(err),
        action: 'retry_silent',
      })
      return NextResponse.json({ error: 'Unexpected error calling Prodigi' }, { status: 503 })
    }

    const { prodigiOutcome, action, metadataStatus, suggestedFix } = classifyApiError(err)

    slog({
      phase: 'webhook.prodigi_error',
      event_id: event.id,
      stripe_session_id: sessionId,
      prodigi_outcome: prodigiOutcome,
      error_category: action === 'retry_silent' ? 'transient' : action === 'retry_notify' ? 'payment_failed' : 'hard_rejection',
      error_message: err.message,
      http_status: err.status,
      action,
    })

    if (action === 'retry_silent') {
      return NextResponse.json({ error: 'Prodigi transient error — Stripe will retry' }, { status: 503 })
    }

    // stop_notify or retry_notify — write metadata, send admin email
    const errorBody = err.body.slice(0, 500)
    const metaUpdate: Record<string, string> = {
      prodigi_status: metadataStatus,
      prodigi_error: errorBody,
    }
    if (prodigiOutcome) metaUpdate.prodigi_outcome = prodigiOutcome

    try {
      await stripe.checkout.sessions.update(sessionId, { metadata: metaUpdate })
      slog({
        phase: 'webhook.metadata_written',
        event_id: event.id,
        stripe_session_id: sessionId,
        prodigi_status: metadataStatus,
        prodigi_outcome: prodigiOutcome,
      })
    } catch (metaErr: unknown) {
      slog({
        phase: 'webhook.metadata_error',
        event_id: event.id,
        stripe_session_id: sessionId,
        error_message: metaErr instanceof Error ? metaErr.message : String(metaErr),
      })
      // For stop_notify, bail with 503 so Stripe retries — we need the metadata breadcrumb
      // For retry_notify we're returning 503 anyway, so just fall through
      if (action === 'stop_notify') {
        return NextResponse.json({ error: 'Metadata write failed after rejection' }, { status: 503 })
      }
    }

    try {
      await sendOrderNeedsAttention({
        stripeSessionId: sessionId,
        customerEmail,
        customerName: shippingName,
        prodigiErrorStatus: err.status,
        prodigiErrorBody: err.body,
        prodigiOutcome: prodigiOutcome ?? undefined,
        suggestedFix,
        itemSummary: resolvedItems.map(i => ({
          title: i.product.title,
          sku: i.sku,
          quantity: i.quantity,
        })),
      })
      slog({
        phase: 'webhook.resend_sent',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'OrderNeedsAttention',
        prodigi_outcome: prodigiOutcome,
      })
    } catch (resendErr: unknown) {
      slog({
        phase: 'webhook.resend_failed',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'OrderNeedsAttention',
        error_message: resendErr instanceof Error ? resendErr.message : String(resendErr),
      })
    }

    slog({
      phase: 'webhook.complete',
      event_id: event.id,
      stripe_session_id: sessionId,
      prodigi_status: metadataStatus,
      prodigi_outcome: prodigiOutcome,
      returned_status_code: action === 'retry_notify' ? 503 : 200,
      duration_ms: Date.now() - startMs,
      ip_country_at_checkout: ipCountryAtCheckout,
      ship_to_country: shipToCountry,
    })

    if (action === 'retry_notify') {
      return NextResponse.json(
        { error: 'Prodigi PaymentFailed — admin notified; Stripe retrying' },
        { status: 503 },
      )
    }
    return NextResponse.json({ received: true })
  }

  // ── Phase 3: webhook.prodigi_posted ──────────────────────────────────────
  slog({
    phase: 'webhook.prodigi_posted',
    event_id: event.id,
    stripe_session_id: sessionId,
    idempotency_key: event.id,
    outcome,
    prodigi_order_id: prodigiOrderId,
    attempted_quote: attemptedQuote,
  })

  // Missing order.id on a presumed-success outcome is a malformed response — retry
  if (prodigiOrderId === null && !['Failed', 'OnHold'].includes(outcome)) {
    slog({
      phase: 'webhook.prodigi_error',
      event_id: event.id,
      stripe_session_id: sessionId,
      error_category: 'unknown',
      error_message: 'Prodigi response missing order.id on success outcome',
      is_transient: true,
    })
    return NextResponse.json({ error: 'Prodigi response malformed' }, { status: 503 })
  }

  // ── Success paths: Ok, Created, CreatedWithIssues, AlreadyExists ──────────
  if (['Ok', 'Created', 'CreatedWithIssues', 'AlreadyExists'].includes(outcome)) {
    if (outcome === 'CreatedWithIssues') {
      slog({
        phase: 'webhook.warn',
        event_id: event.id,
        stripe_session_id: sessionId,
        message: 'Prodigi created order with issues',
        prodigi_order_id: prodigiOrderId,
      })
    }

    // ── Step 11: write Stripe metadata ────────────────────────────────────
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          prodigi_order_id: prodigiOrderId ?? '',
          prodigi_status: 'created',
        },
      })
      slog({
        phase: 'webhook.metadata_written',
        event_id: event.id,
        stripe_session_id: sessionId,
        prodigi_status: 'created',
      })
    } catch (metaErr: unknown) {
      // Return 5xx — Stripe retries; Prodigi returns AlreadyExists; metadata write self-heals
      slog({
        phase: 'webhook.metadata_error',
        event_id: event.id,
        stripe_session_id: sessionId,
        error_message: metaErr instanceof Error ? metaErr.message : String(metaErr),
      })
      return NextResponse.json({ error: 'Metadata write failed' }, { status: 503 })
    }

    // ── Step 12: send OrderReceived (best-effort) ─────────────────────────
    const isAlreadyExists = outcome === 'AlreadyExists'
    const wasAlreadyCreated = session.metadata?.prodigi_status === 'created'

    if (isAlreadyExists && wasAlreadyCreated) {
      slog({
        phase: 'webhook.resend_skipped_dedupe',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'OrderReceived',
      })
    } else {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 })
        const currency = session.currency ?? 'eur'
        await sendOrderReceived(customerEmail, {
          customerName: shippingName,
          orderRef: sessionId.slice(-8).toUpperCase(),
          items: lineItems.data.map(li => ({
            title: li.description ?? '—',
            quantity: li.quantity ?? 1,
            priceFormatted: formatCents(li.amount_total ?? 0, currency),
          })),
          totalFormatted: formatCents(session.amount_total ?? 0, currency),
          shippingAddress: {
            line1: addr?.line1 ?? '',
            ...(addr?.line2 ? { line2: addr.line2 } : {}),
            city: addr?.city ?? '',
            postalCode: addr?.postal_code ?? '',
            country: shipToCountry,
          },
          estimatedDeliveryDays: '5–10 business days',
        })
        slog({
          phase: 'webhook.resend_sent',
          event_id: event.id,
          stripe_session_id: sessionId,
          template: 'OrderReceived',
        })
      } catch (resendErr: unknown) {
        slog({
          phase: 'webhook.resend_failed',
          event_id: event.id,
          stripe_session_id: sessionId,
          template: 'OrderReceived',
          error_message: resendErr instanceof Error ? resendErr.message : String(resendErr),
        })
      }
    }

    slog({
      phase: 'webhook.complete',
      event_id: event.id,
      stripe_session_id: sessionId,
      prodigi_status: 'created',
      returned_status_code: 200,
      duration_ms: Date.now() - startMs,
      ip_country_at_checkout: ipCountryAtCheckout,
      ship_to_country: shipToCountry,
    })
    return NextResponse.json({ received: true })
  }

  // ── Needs-attention paths: OnHold, Failed ─────────────────────────────────
  if (['OnHold', 'Failed'].includes(outcome)) {
    slog({
      phase: 'webhook.prodigi_error',
      event_id: event.id,
      stripe_session_id: sessionId,
      error_category: outcome === 'OnHold' ? 'onhold' : 'unknown',
      error_message: `Prodigi outcome: ${outcome}`,
      is_transient: false,
    })

    const errorSummary = `Prodigi outcome: ${outcome}`
    const metadataToWrite: Record<string, string> = {
      prodigi_status: 'needs_attention',
      prodigi_error: errorSummary,
    }
    if (prodigiOrderId) metadataToWrite.prodigi_order_id = prodigiOrderId

    try {
      await stripe.checkout.sessions.update(sessionId, { metadata: metadataToWrite })
      slog({
        phase: 'webhook.metadata_written',
        event_id: event.id,
        stripe_session_id: sessionId,
        prodigi_status: 'needs_attention',
      })
    } catch (metaErr: unknown) {
      slog({
        phase: 'webhook.metadata_error',
        event_id: event.id,
        stripe_session_id: sessionId,
        error_message: metaErr instanceof Error ? metaErr.message : String(metaErr),
      })
      return NextResponse.json({ error: 'Metadata write failed' }, { status: 503 })
    }

    try {
      await sendOrderNeedsAttention({
        stripeSessionId: sessionId,
        customerEmail,
        customerName: shippingName,
        prodigiErrorStatus: 0,
        prodigiErrorBody: errorSummary,
        prodigiOutcome: outcome,
        itemSummary: resolvedItems.map(i => ({
          title: i.product.title,
          sku: i.sku,
          quantity: i.quantity,
        })),
      })
      slog({
        phase: 'webhook.resend_sent',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'OrderNeedsAttention',
        prodigi_outcome: outcome,
      })
    } catch (resendErr: unknown) {
      slog({
        phase: 'webhook.resend_failed',
        event_id: event.id,
        stripe_session_id: sessionId,
        template: 'OrderNeedsAttention',
        error_message: resendErr instanceof Error ? resendErr.message : String(resendErr),
      })
    }

    slog({
      phase: 'webhook.complete',
      event_id: event.id,
      stripe_session_id: sessionId,
      prodigi_status: 'needs_attention',
      prodigi_outcome: outcome,
      returned_status_code: 200,
      duration_ms: Date.now() - startMs,
      ip_country_at_checkout: ipCountryAtCheckout,
      ship_to_country: shipToCountry,
    })
    return NextResponse.json({ received: true })
  }

  // Unknown outcome — treat as transient so Stripe retries
  slog({
    phase: 'webhook.prodigi_error',
    event_id: event.id,
    stripe_session_id: sessionId,
    error_category: 'unknown',
    error_message: `Unexpected Prodigi outcome: ${outcome}`,
    is_transient: true,
  })
  return NextResponse.json({ error: `Unexpected Prodigi outcome: ${outcome}` }, { status: 503 })
}
