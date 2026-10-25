'use client'
import { useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'

// Rehydrates the persisted cart after mount (the store uses skipHydration so
// SSR renders an empty cart and there is no hydration mismatch).
export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [])

  return <>{children}</>
}
