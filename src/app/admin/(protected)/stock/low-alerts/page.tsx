'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string
  unit: string
  stock: number
  minStock: number
  buyPrice: number
  category?: { name: string } | null
  supplier?: { name: string } | null
}

export default function LowAlertsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/products?lowStock=true')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">কম স্টক সতর্কতা ⚠️</h1>
        <span className="text-sm text-orange-600 font-medium">{products.length} টি পণ্য</span>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : products.length === 0 ? (
        <div className="bg-green-50 rounded-xl p-8 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-green-700 font-medium">সব পণ্যের পর্যাপ্ত স্টক আছে!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ক্যাটাগরি</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">সাপ্লায়ার</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বর্তমান স্টক</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">ন্যূন্যতম</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">ঘাটতি</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.stock === 0 ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.supplier?.name || '—'}</td>
                  <td className={`px-4 py-3 text-right font-bold text-lg ${p.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>{p.stock}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.minStock}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{Math.max(0, p.minStock - p.stock)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/admin/purchases" className="text-amber-700 hover:underline text-xs">ক্রয় করুন →</Link>
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
