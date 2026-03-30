import Link from 'next/link'
import Stripe from 'stripe'

export const metadata = {
  title: 'Order confirmed — StudioTJ',
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id

  let session: Stripe.Checkout.Session | null = null

  if (sessionId) {
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      })
    } catch {
      // fall through — show generic confirmation without order details
    }
  }

  const email = session?.customer_details?.email
  const orderRef = session ? session.id.slice(-8).toUpperCase() : null
  const lineItems = session?.line_items?.data ?? []
  const currency = session?.currency ?? 'eur'
  const total = session?.amount_total
  const shippingTotal = session?.shipping_cost?.amount_total

  return (
    <div className="pt-24 px-6 md:px-12 pb-20 min-h-[70vh]">
      <div className="max-w-lg">

        {/* Header */}
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-4">StudioTJ</p>
        <h1 className="font-display text-5xl text-ink leading-tight mb-2">
          Thank you for<br />your order.
        </h1>
        {orderRef && (
          <p className="text-xs tracking-widest uppercase text-dust mb-8">
            Order #{orderRef}
          </p>
        )}

        {/* Shipping info */}
        <div className="mb-10 space-y-1.5">
          {email ? (
            <>
              <p className="text-muted leading-relaxed">
                We'll send a shipping confirmation to{' '}
                <span className="text-ink">{email}</span> once your order dispatches.
              </p>
            </>
          ) : (
            <p className="text-muted leading-relaxed">
              We'll send a shipping confirmation to your email once your order dispatches.
            </p>
          )}
          <p className="text-muted leading-relaxed">
            Estimated delivery: 5–10 business days.
          </p>
        </div>

        {/* Receipt */}
        {lineItems.length > 0 && (
          <div className="border-t border-dust/40 pt-8 mb-10">
            <p className="text-xs tracking-widest uppercase text-muted mb-6">Order summary</p>

            <div className="space-y-5">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink leading-snug">{item.description}</p>
                    <p className="text-xs text-dust mt-0.5 tracking-wide">
                      Qty {item.quantity ?? 1}
                    </p>
                  </div>
                  <p className="text-sm text-ink tabular-nums whitespace-nowrap">
                    {item.amount_total != null
                      ? formatAmount(item.amount_total, currency)
                      : '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* Shipping */}
            {shippingTotal != null && (
              <div className="flex justify-between items-center mt-6 pt-5 border-t border-dust/20">
                <p className="text-xs tracking-widest uppercase text-muted">Shipping</p>
                <p className="text-sm text-ink tabular-nums">
                  {shippingTotal === 0 ? 'Free' : formatAmount(shippingTotal, currency)}
                </p>
              </div>
            )}

            {/* Total */}
            {total != null && (
              <div className="flex justify-between items-center mt-4 pt-5 border-t border-dust/40">
                <p className="text-xs tracking-widest uppercase text-ink">Total paid</p>
                <p className="text-sm text-ink font-medium tabular-nums">
                  {formatAmount(total, currency)}
                </p>
              </div>
            )}
          </div>
        )}

        <Link href="/shop" className="btn-outline">
          Back to shop
        </Link>
      </div>
    </div>
  )
}
