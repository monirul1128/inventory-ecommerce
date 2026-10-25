'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Product {
  id: string
  name: string
  sku: string
  unit: string
  stock: number
  buyPrice: number
  expiryDate: string
  category?: { name: string } | null
}

export default function ExpiryAlertsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/products?expiringSoon=true')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }, [])

  const getDaysUntilExpiry = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">মেয়াদ সতর্কতা ⏰</h1>
        <span className="text-sm text-orange-600 font-medium">{products.length} টি পণ্য (৩০ দিনের মধ্যে মেয়াদ শেষ)</span>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : products.length === 0 ? (
        <div className="bg-green-50 rounded-xl p-8 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-green-700 font-medium">৩০ দিনের মধ্যে মেয়াদ শেষ হওয়ার কোনো পণ্য নেই!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-yellow-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ক্যাটাগরি</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">স্টক</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">স্টক মূল্য</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">মেয়াদ তারিখ</th>
                <th className="text-center px-4 py-3 text-gray-600 font-medium">বাকি দিন</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const daysLeft = getDaysUntilExpiry(p.expiryDate)
                return (
                  <tr key={p.id} className={`border-b hover:bg-gray-50 ${daysLeft <= 7 ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">{p.stock} {p.unit}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.stock * p.buyPrice)}</td>
                    <td className="px-4 py-3">{formatDate(p.expiryDate)}</td>
                    <td className="px-4 py-3 text-center">
                      {daysLeft <= 0 ? (
                        <Badge variant="destructive">মেয়াদ শেষ</Badge>
                      ) : daysLeft <= 7 ? (
                        <Badge variant="destructive">{daysLeft} দিন</Badge>
                      ) : daysLeft <= 15 ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">{daysLeft} দিন</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">{daysLeft} দিন</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
