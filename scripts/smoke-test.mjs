/**
 * Task C smoke tests — StudioTJ shop pipeline
 *
 * Runs 10 end-to-end scenarios (one per product family + 3 FAP frame colours):
 *   1. POST /api/checkout  → creates a real Stripe test session
 *   2. POST /api/webhook   → synthetic checkout.session.completed event signed with
 *      STRIPE_WEBHOOK_SECRET, referencing the real session ID so that
 *      stripe.checkout.sessions.update() and listLineItems() succeed inside the handler
 *   3. Polls Stripe to verify prodigi_status == 'created' written to session metadata
 *
 * Prerequisites: dev server running on localhost:3000 with .env.local loaded.
 */
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
const Stripe = require('stripe')

// ── Load .env.local ────────────────────────────────────────────────────────────
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq < 0) continue
  const k = t.slice(0, eq).trim()
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[k]) process.env[k] = v
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const DEV_URL = 'http://localhost:3000'

if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
  console.error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in .env.local')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

// ── Test cases ─────────────────────────────────────────────────────────────────
const TESTS = [
  { label: 'can   (canvas 16×12)',          variantId: 'photo-atmospheric-leiden-017-can-16x12',           price: 4080 },
  { label: 'fap-blk (framed A4 black)',     variantId: 'photo-atmospheric-leiden-017-fap-a4-black',        price: 5600 },
  { label: 'fap-nat (framed A4 natural-oak)',variantId: 'photo-atmospheric-leiden-017-fap-a4-natural-oak', price: 5600 },
  { label: 'fap-wht (framed A4 white)',     variantId: 'photo-atmospheric-leiden-017-fap-a4-white',        price: 5600 },
  { label: 'hpr   (Photo Rag A3)',          variantId: 'photo-atmospheric-leiden-017-hpr-a3',              price: 1800 },
  { label: 'hge   (German Etching A3)',     variantId: 'photo-atmospheric-leiden-017-hge-a3',              price: 1800 },
  { label: 'ema   (Matte Art A3)',          variantId: 'photo-atmospheric-leiden-017-ema-a3',              price: 1190 },
  { label: 'clp   (C-type 16×20)',          variantId: 'photo-atmospheric-leiden-068-clp-16x20',           price: 2250 },
  { label: 'gre   (greeting card pack10)',  variantId: 'photo-atmospheric-leiden-068-gre-6x4-pack10',      price: 2800 },
  { label: 'pos   (postcard pack10)',       variantId: 'photo-atmospheric-leiden-017-pos-6x4-pack10',      price: 2700 },
]

// ── Shared test shipping address ───────────────────────────────────────────────
const TEST_SHIPPING = {
  name: 'Smoke Test Customer',
  address: {
    line1: 'Keizersgracht 1',
    line2: null,
    city: 'Amsterdam',
    postal_code: '1015 CJ',
    country: 'NL',
    state: null,
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function signEvent(eventBody) {
  const payload = JSON.stringify(eventBody)
  const timestamp = Math.floor(Date.now() / 1000)
  const toSign = `${timestamp}.${payload}`
  const sig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(toSign, 'utf8')
    .digest('hex')
  return { payload, header: `t=${timestamp},v1=${sig}` }
}

async function waitForServer(maxMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(`${DEV_URL}/api/checkout`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } })
      if (r.status < 500 || r.status === 400) return // server is up (400 = validation error = fine)
    } catch {
      // not up yet
    }
    await delay(2000)
  }
  throw new Error('Dev server did not start within timeout')
}

async function createSession(variantId, price) {
  const res = await fetch(`${DEV_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vercel-ip-country': 'NL',    // simulate NL visitor for shipping quote
    },
    body: JSON.stringify({ items: [{ productId: variantId, price, quantity: 1 }] }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`POST /api/checkout → ${res.status}: ${body}`)
  }
  const { url } = await res.json()
  // Stripe checkout URL: https://checkout.stripe.com/c/pay/cs_test_XXXX...
  const match = url?.match(/\/(cs_(?:test|live)_[A-Za-z0-9]+)/)
  if (!match) throw new Error(`Could not extract session ID from URL: ${url}`)
  return match[1]
}

async function fireWebhook(sessionId, variantId) {
  const eventId = `evt_smoke_${Date.now()}_${variantId.slice(-8)}`
  const event = {
    id: eventId,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        amount_total: 4000,   // not used by webhook logic; only for formatting
        currency: 'eur',
        metadata: {
          order_items: `${variantId}:1`,
          shipping_source: 'quote',
          ip_country: 'NL',
        },
        collected_information: {
          shipping_details: TEST_SHIPPING,
        },
        customer_details: {
          email: 'smoke-test@studiotj.com',
        },
      },
    },
  }

  const { payload, header } = signEvent(event)
  const res = await fetch(`${DEV_URL}/api/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': header,
    },
    body: payload,
  })
  const body = await res.text()
  return { status: res.status, body, eventId }
}

async function pollStripeMetadata(sessionId, maxMs = 10_000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const status = session.metadata?.prodigi_status
    const orderId = session.metadata?.prodigi_order_id
    if (status === 'created' || status === 'needs_attention') {
      return { prodigiStatus: status, prodigiOrderId: orderId ?? null }
    }
    await delay(1000)
  }
  return { prodigiStatus: 'timeout', prodigiOrderId: null }
}

// ── Main ───────────────────────────────────────────────────────────────────────
console.log('\n=== StudioTJ Smoke Tests — Task C ===\n')
console.log('Waiting for dev server...')
await waitForServer()
console.log('Dev server ready.\n')

const results = []

for (const test of TESTS) {
  process.stdout.write(`[${test.label}] `)

  let sessionId, webhookResult, stripeVerification
  let checkoutStatus = 'SKIP'
  let webhookStatus = 'SKIP'
  let finalStatus = 'SKIP'
  let prodigiOrderId = null
  let notes = ''

  // Part 1: checkout creation
  try {
    sessionId = await createSession(test.variantId, test.price)
    checkoutStatus = 'OK'
    process.stdout.write(`checkout:OK session:${sessionId.slice(-12)} → `)
  } catch (err) {
    checkoutStatus = 'FAIL'
    notes = err.message.slice(0, 80)
    process.stdout.write(`checkout:FAIL ${notes}\n`)
    results.push({ ...test, checkoutStatus, webhookStatus: 'SKIP', finalStatus: 'FAIL', prodigiOrderId: null, notes })
    continue
  }

  // Part 2: webhook event
  try {
    webhookResult = await fireWebhook(sessionId, test.variantId)
    if (webhookResult.status === 200) {
      webhookStatus = 'OK'
      process.stdout.write(`webhook:200 → `)
    } else {
      webhookStatus = 'FAIL'
      notes = `webhook ${webhookResult.status}: ${webhookResult.body.slice(0, 80)}`
      process.stdout.write(`webhook:${webhookResult.status} FAIL\n`)
      results.push({ ...test, checkoutStatus, webhookStatus, finalStatus: 'FAIL', prodigiOrderId: null, sessionId, notes })
      continue
    }
  } catch (err) {
    webhookStatus = 'FAIL'
    notes = err.message.slice(0, 80)
    process.stdout.write(`webhook:ERR\n`)
    results.push({ ...test, checkoutStatus, webhookStatus, finalStatus: 'FAIL', prodigiOrderId: null, sessionId, notes })
    continue
  }

  // Part 3: verify Stripe metadata updated
  try {
    stripeVerification = await pollStripeMetadata(sessionId)
    prodigiOrderId = stripeVerification.prodigiOrderId
    if (stripeVerification.prodigiStatus === 'created') {
      finalStatus = 'PASS'
      process.stdout.write(`Prodigi:${prodigiOrderId}\n`)
    } else if (stripeVerification.prodigiStatus === 'needs_attention') {
      finalStatus = 'NEEDS_ATTN'
      notes = 'Prodigi returned error — check Stripe session metadata'
      process.stdout.write(`Prodigi:needs_attention\n`)
    } else {
      finalStatus = 'TIMEOUT'
      notes = 'Stripe metadata not updated within 10s'
      process.stdout.write(`timeout\n`)
    }
  } catch (err) {
    finalStatus = 'FAIL'
    notes = err.message.slice(0, 80)
    process.stdout.write(`poll error\n`)
  }

  results.push({ ...test, checkoutStatus, webhookStatus, finalStatus, prodigiOrderId, sessionId: sessionId ?? null, notes })
}

// ── Results table ──────────────────────────────────────────────────────────────
console.log('\n')
console.log('═'.repeat(110))
console.log(`${'FAMILY'.padEnd(30)} ${'CHECKOUT'.padEnd(10)} ${'WEBHOOK'.padEnd(10)} ${'FINAL'.padEnd(12)} ${'PRODIGI ORDER ID'.padEnd(28)} NOTES`)
console.log('─'.repeat(110))

let passes = 0, fails = 0, needsAttn = 0
for (const r of results) {
  const status = r.finalStatus === 'PASS' ? '✓ PASS' :
                 r.finalStatus === 'NEEDS_ATTN' ? '⚠ ATTN' :
                 r.finalStatus === 'FAIL' ? '✗ FAIL' :
                 r.finalStatus
  if (r.finalStatus === 'PASS') passes++
  else if (r.finalStatus === 'NEEDS_ATTN') needsAttn++
  else if (r.finalStatus !== 'SKIP') fails++

  console.log(
    `${r.label.padEnd(30)} ${r.checkoutStatus.padEnd(10)} ${r.webhookStatus.padEnd(10)} ${status.padEnd(12)} ${(r.prodigiOrderId ?? '—').padEnd(28)} ${r.notes}`
  )
}
console.log('─'.repeat(110))
console.log(`\nResult: ${passes}/${results.length} passed, ${needsAttn} needs_attention, ${fails} failed`)

// ── Session ID reference ───────────────────────────────────────────────────────
console.log('\n── Stripe session IDs ───')
for (const r of results) {
  if (r.sessionId) console.log(`  ${r.label.slice(0, 28).padEnd(30)} ${r.sessionId}`)
}

// ── Summary verdict ────────────────────────────────────────────────────────────
console.log()
if (fails === 0 && needsAttn === 0) {
  console.log('✓ GREEN — all scenarios passed end-to-end')
} else if (passes + needsAttn === results.length && fails === 0) {
  console.log('⚠ YELLOW — all orders created; some need attention (check Prodigi dashboard)')
} else {
  console.log('✗ RED — pipeline has failures; check notes above')
}
