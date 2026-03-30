'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/printify'

export default function CartDrawer() {
  const { items, itemCount, subtotal, drawerOpen, removeItem, updateQuantity, closeDrawer } =
    useCart()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    if (items.length === 0) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setChecking(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-40 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-paper z-50 flex flex-col shadow-xl transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dust/30">
          <p className="text-sm tracking-widest uppercase text-ink">
            Cart {itemCount > 0 && `(${itemCount})`}
          </p>
          <button
            onClick={closeDrawer}
            className="text-muted hover:text-ink transition-colors text-xl leading-none"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="text-muted text-sm mt-8 text-center">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-dust/20">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="py-5 flex gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 flex-shrink-0 bg-dust/20 relative overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productTitle}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-dust/30" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink leading-snug truncate">
                      {item.productTitle}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{item.variantLabel}</p>
                    <p className="text-sm text-ink mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-dust">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-muted hover:text-ink transition-colors"
                          aria-label="Decrease quantity"
                        >
                          –
                        </button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-muted hover:text-ink transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-xs text-dust hover:text-ink transition-colors uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-dust/30 px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-widest uppercase text-muted">Subtotal</span>
              <span className="text-ink">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-dust">Shipping calculated at checkout.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={checking}
              className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {checking ? 'Redirecting…' : 'Checkout →'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
