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
  productTitle: string
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
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex((i) => i.productId === action.item.productId)
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
        items: state.items.filter((i) => i.productId !== action.productId),
      }
    case 'UPDATE_QTY': {
      if (action.qty <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.productId !== action.productId),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: action.qty } : i
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
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
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
    removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', productId }),
    updateQuantity: (productId, qty) => dispatch({ type: 'UPDATE_QTY', productId, qty }),
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
