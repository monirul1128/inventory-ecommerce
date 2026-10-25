import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string | null
  qty: number
  unit: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const qty = item.qty ?? 1
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                unit: item.unit,
                qty,
              },
            ],
          }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, qty) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'furniture-cart',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)

// Selectors (return primitives, so no shallow compare needed)
export const selectTotalItems = (s: CartState) =>
  s.items.reduce((n, i) => n + i.qty, 0)

export const selectTotalPrice = (s: CartState) =>
  s.items.reduce((n, i) => n + i.qty * i.price, 0)

// Delivery charge: ৳60, free over ৳5000, none on an empty cart
export const getDelivery = (subtotal: number): number =>
  subtotal <= 0 ? 0 : subtotal >= 5000 ? 0 : 60
