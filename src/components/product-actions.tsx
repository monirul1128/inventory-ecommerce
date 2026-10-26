'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/lib/cart-store'

export interface ProductActionsProduct {
  id: string
  name: string
  sellPrice: number
  stock: number
  unit: string
}

export function ProductActions({ product }: { product: ProductActionsProduct }) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)

  const inStock = product.stock > 0

  const handleAddToCart = () => {
    if (!inStock) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.sellPrice,
      image: null,
      unit: product.unit,
      qty,
    })
    toast.success(`${qty} টি কার্টে যোগ হয়েছে`)
  }

  const handleBuyNow = () => {
    if (!inStock) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.sellPrice,
      image: null,
      unit: product.unit,
      qty,
    })
    router.push('/checkout')
  }

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">পরিমাণ:</span>
        <div className="flex items-center gap-2 border border-amber-200 rounded-lg px-2 py-1">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={!inStock}
            className="w-8 h-8 flex items-center justify-center text-amber-700 hover:bg-amber-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
            disabled={!inStock}
            min={1}
            max={product.stock}
            className="w-16 text-center font-semibold text-gray-900 bg-transparent focus:outline-none disabled:opacity-40"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={!inStock}
            className="w-8 h-8 flex items-center justify-center text-amber-700 hover:bg-amber-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="flex-1 bg-amber-700 text-white py-3 rounded-xl font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart size={18} />
          কার্টে যোগ করুন
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock}
          className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap size={18} />
          এখনই কিনুন
        </button>
      </div>
    </div>
  )
}
