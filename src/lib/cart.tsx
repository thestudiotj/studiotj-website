'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  variantId: number
  productTitle: string
  variantLabel: string
  price: number       // cents
  imageUrl: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  drawerOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; productId: string; variantId: number }
  | { type: 'UPDATE_QTY'; productId: string; variantId: number; qty: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex(
        (i) => i.productId === action.item.productId && i.variantId === action.item.variantId
      )
      if (existing >= 0) {
        const items = [...state.items]
        items[existing] = { ...items[existing], quantity: items[existing].quantity + 1 }
        return { ...state, items }
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.productId === action.productId && i.variantId === action.variantId)
        ),
      }
    case 'UPDATE_QTY': {
      if (action.qty <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.productId === action.productId && i.variantId === action.variantId)
          ),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId && i.variantId === action.variantId
            ? { ...i, quantity: action.qty }
            : i
        ),
      }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'OPEN_DRAWER':
      return { ...state, drawerOpen: true }
    case 'CLOSE_DRAWER':
      return { ...state, drawerOpen: false }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  drawerOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, variantId: number) => void
  updateQuantity: (productId: string, variantId: number, qty: number) => void
  clearCart: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'studiotj_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], drawerOpen: false })
  const [hydrated, setHydrated] = useState(false)

  // Load persisted cart after mount (avoid SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items: CartItem[] = JSON.parse(stored)
        items.forEach((item) => dispatch({ type: 'ADD_ITEM', item }))
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true)
  }, [])

  // Persist items on every change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // ignore storage errors
    }
  }, [state.items, hydrated])

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const value: CartContextValue = {
    items: state.items,
    itemCount,
    subtotal,
    drawerOpen: state.drawerOpen,
    addItem: (item) => dispatch({ type: 'ADD_ITEM', item }),
    removeItem: (productId, variantId) =>
      dispatch({ type: 'REMOVE_ITEM', productId, variantId }),
    updateQuantity: (productId, variantId, qty) =>
      dispatch({ type: 'UPDATE_QTY', productId, variantId, qty }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    openDrawer: () => dispatch({ type: 'OPEN_DRAWER' }),
    closeDrawer: () => dispatch({ type: 'CLOSE_DRAWER' }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
