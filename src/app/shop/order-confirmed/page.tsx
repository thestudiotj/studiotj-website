import Link from 'next/link'

export const metadata = {
  title: 'Order confirmed',
}

export default function OrderConfirmedPage() {
  return (
    <div className="pt-24 px-6 md:px-12 pb-20 min-h-[70vh] flex flex-col justify-center">
      <div className="max-w-md">
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-4">StudioTJ</p>
        <h1 className="font-display text-5xl text-ink leading-tight mb-6">
          Order confirmed.
        </h1>
        <p className="text-muted leading-relaxed mb-2">
          Thank you — your order is on its way to the printer.
        </p>
        <p className="text-muted leading-relaxed mb-10">
          You'll receive a shipping confirmation by email once it dispatches.
          Delivery typically takes 5–10 business days.
        </p>
        <Link href="/shop" className="btn-outline">
          Back to shop
        </Link>
      </div>
    </div>
  )
}
