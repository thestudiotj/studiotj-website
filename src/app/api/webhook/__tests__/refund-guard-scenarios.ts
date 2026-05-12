/**
 * Simulated Stripe charge payloads for manual / future-automated testing of the
 * refund guard in route.ts (Phase 2b).
 *
 * No test runner is wired up yet. Use these payloads as reference when:
 *   a) setting up Jest/Vitest in a future session, or
 *   b) spot-testing in Stripe test mode (see "Manual Stripe test-mode steps" below).
 *
 * THREE SCENARIOS
 * ───────────────
 * 1. Full refund     → guard fires, Prodigi skipped, admin alerted, 200 returned
 * 2. Partial refund  → guard fires (amount_refunded > 0), same skip path
 * 3. Normal paid     → guard passes, existing fulfillment path runs unchanged
 */

import type Stripe from 'stripe'

// ── Shared base for a Stripe Charge ──────────────────────────────────────────

function baseCharge(overrides: Partial<Stripe.Charge>): Stripe.Charge {
  return {
    id: 'ch_test_000000000000000',
    object: 'charge',
    amount: 4900,
    amount_captured: 4900,
    amount_refunded: 0,
    balance_transaction: 'txn_test_000',
    billing_details: { address: null, email: 'buyer@example.com', name: 'Test Buyer', phone: null },
    captured: true,
    created: Math.floor(Date.now() / 1000) - 3600,
    currency: 'eur',
    customer: null,
    description: null,
    destination: null,
    dispute: null,
    disputed: false,
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    fraud_details: {},
    invoice: null,
    livemode: false,
    metadata: {},
    on_behalf_of: null,
    outcome: null,
    paid: true,
    payment_intent: 'pi_test_000000000000000',
    payment_method: 'pm_test_000',
    payment_method_details: null,
    radar_options: {},
    receipt_email: null,
    receipt_number: null,
    receipt_url: null,
    refunded: false,
    refunds: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/charges/ch_test_000/refunds',
    },
    review: null,
    shipping: null,
    source: null,
    source_transfer: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: 'succeeded',
    transfer_data: null,
    transfer_group: null,
    ...overrides,
  } as unknown as Stripe.Charge
}

// ── Scenario 1: Full refund ───────────────────────────────────────────────────
//
// EXPECTED BEHAVIOUR
//   refundGuardCharge.refunded === true
//   → handler logs webhook.refund_guard with action: 'skipped_refunded'
//   → stripe.checkout.sessions.update called with prodigi_status: 'skipped_refunded'
//   → sendAdminAlert called (subject contains "charge was refunded")
//   → response: 200 { received: true }
//   → Prodigi createOrder is NOT called

export const scenario1_fullRefund: Stripe.Charge = baseCharge({
  id: 'ch_test_full_refund',
  amount: 4900,
  amount_refunded: 4900,
  refunded: true,
  refunds: {
    object: 'list',
    data: [
      {
        id: 're_test_full',
        object: 'refund',
        amount: 4900,
        balance_transaction: null,
        charge: 'ch_test_full_refund',
        created: Math.floor(Date.now() / 1000) - 1800,
        currency: 'eur',
        metadata: {},
        payment_intent: 'pi_test_000',
        reason: null,
        receipt_number: null,
        source_transfer_reversal: null,
        status: 'succeeded',
        transfer_reversal: null,
      } as unknown as Stripe.Refund,
    ],
    has_more: false,
    url: '/v1/charges/ch_test_full_refund/refunds',
  },
})

// ── Scenario 2: Partial refund ────────────────────────────────────────────────
//
// EXPECTED BEHAVIOUR (same skip path — partial refunds treated as full for safety)
//   refundGuardCharge.amount_refunded > 0 && refundGuardCharge.refunded === false
//   → handler logs webhook.refund_guard with action: 'skipped_refunded'
//   → stripe.checkout.sessions.update called with prodigi_status: 'skipped_refunded'
//   → sendAdminAlert called
//   → response: 200 { received: true }
//   → Prodigi createOrder is NOT called

export const scenario2_partialRefund: Stripe.Charge = baseCharge({
  id: 'ch_test_partial_refund',
  amount: 4900,
  amount_refunded: 2450,
  refunded: false,
  refunds: {
    object: 'list',
    data: [
      {
        id: 're_test_partial',
        object: 'refund',
        amount: 2450,
        balance_transaction: null,
        charge: 'ch_test_partial_refund',
        created: Math.floor(Date.now() / 1000) - 900,
        currency: 'eur',
        metadata: {},
        payment_intent: 'pi_test_000',
        reason: null,
        receipt_number: null,
        source_transfer_reversal: null,
        status: 'succeeded',
        transfer_reversal: null,
      } as unknown as Stripe.Refund,
    ],
    has_more: false,
    url: '/v1/charges/ch_test_partial_refund/refunds',
  },
})

// ── Scenario 3: Normal paid order ─────────────────────────────────────────────
//
// EXPECTED BEHAVIOUR
//   refundGuardCharge.refunded === false && refundGuardCharge.amount_refunded === 0
//   → refund guard condition is false, guard block is skipped
//   → existing fulfillment path (SKU resolution → Prodigi → OrderReceived email) runs unchanged

export const scenario3_normalPaid: Stripe.Charge = baseCharge({
  id: 'ch_test_normal_paid',
  amount: 4900,
  amount_refunded: 0,
  refunded: false,
})

// ── Manual Stripe test-mode verification steps ────────────────────────────────
//
// Prerequisites: webhook URL pointed at your local dev server via Stripe CLI
//   stripe listen --forward-to localhost:3000/api/webhook
//
// Scenario 1 — full refund guard:
//   1. Complete a test checkout in Stripe test mode
//   2. Immediately refund the full charge in the Stripe dashboard (or via CLI)
//   3. In the Stripe dashboard → Webhooks → select the event → Resend
//   4. Confirm the handler returns 200 in the Stripe delivery log
//   5. Confirm no Prodigi order appears in the Prodigi sandbox dashboard
//   6. Confirm admin alert email arrives with subject "[StudioTJ] Order skipped — Stripe charge was refunded"
//   7. Confirm Stripe session metadata shows prodigi_status: skipped_refunded
//
// Scenario 2 — partial refund guard:
//   Same as Scenario 1 but issue a partial refund (e.g. 50% of the order total)
//
// Scenario 3 — normal path unchanged:
//   Complete a test checkout, do NOT refund, trigger webhook normally
//   Confirm Prodigi order is created and OrderReceived email is sent
