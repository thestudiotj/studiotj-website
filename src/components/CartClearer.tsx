'use client'

import { useEffect } from 'react'
import { useCart, CART_STORAGE_KEY } from '@/lib/cart'

// Clears localStorage before CartProvider hydrates (child effects run first),
// so a page reload of order-confirmed still sees an empty cart.
export function CartClearer() {
  const { clearCart } = useCart()

  useEffect(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch {}
    clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
