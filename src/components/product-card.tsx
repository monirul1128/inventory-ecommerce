'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/utils'

export interface ProductCardProduct {
  id: string
  name: string
  sellPrice: number
  images: string[]
  stock: number
  category?: { name: string; slug: string }
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const addItem = useCartStore((s) => s.addItem)
  const outOfStock = product.stock <= 0
  const image = product.images[0] ?? null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/product/${product.id}`}>
        <div className="relative h-44 bg-amber-50 flex items-center justify-center overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-6xl">🪑</span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 hover:text-amber-700 transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.category && (
          <p className="text-xs text-amber-600 mb-1">{product.category.name}</p>
        )}
        <p className="text-amber-800 font-bold text-base mb-3">
          {formatCurrency(product.sellPrice)}
        </p>
        <button
          onClick={() => {
            addItem({
              id: product.id,
              name: product.name,
              price: product.sellPrice,
              image,
              qty: 1,
              unit: 'PIECE',
            })
            toast.success(`${product.name} কার্টে যোগ হয়েছে!`)
          }}
          disabled={outOfStock}
          className="w-full bg-amber-700 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <ShoppingCart size={12} />
          {outOfStock ? 'স্টক নেই' : 'কার্টে যোগ করুন'}
        </button>
      </div>
    </div>
  )
}
