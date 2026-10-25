'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  unit: string
  stock: number
  minStock: number
  sellPrice: number
  buyPrice: number
  category?: { name: string } | null
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = search ? `?search=${search}` : ''
    const res = await fetch(`/api/products${params}`)
    setProducts(await res.json())
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const totalValue = products.reduce((s, p) => s + p.stock * p.buyPrice, 0)
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">বর্তমান স্টক</h1>
        <div className="flex gap-2">
          <Link href="/admin/stock/low-alerts" className="text-sm text-orange-600 hover:underline">⚠️ কম স্টক ({lowStockCount})</Link>
          <span className="text-gray-300">|</span>
          <Link href="/admin/stock/movements" className="text-sm text-blue-600 hover:underline">মুভমেন্ট →</Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
          <p className="text-xs text-gray-500">মোট পণ্য</p>
          <p className="text-2xl font-bold text-amber-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
          <p className="text-xs text-gray-500">কম স্টক</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
          <p className="text-xs text-gray-500">স্টকের মোট মূল্য</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      <input
        className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        placeholder="পণ্য খুঁজুন..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">SKU</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ক্যাটাগরি</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">একক</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বর্তমান স্টক</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">ন্যূন্যতম</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">মূল্য (ক্রয়)</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">স্টক মূল্য</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">কোনো পণ্য নেই</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.stock <= p.minStock ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">{p.stock}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.minStock}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.buyPrice)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.stock * p.buyPrice)}</td>
                  <td className="px-4 py-3 text-center">
                    {p.stock === 0 ? (
                      <Badge variant="destructive">স্টক শেষ</Badge>
                    ) : p.stock <= p.minStock ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">কম</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-green-700 bg-green-50">ঠিক আছে</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
