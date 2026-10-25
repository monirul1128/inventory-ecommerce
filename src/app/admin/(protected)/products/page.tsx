'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: number
  minStock: number
  isFeatured: boolean
  images: string[]
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter) params.set('categoryId', categoryFilter)
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/products?${params}`),
      fetch('/api/categories'),
    ])
    setProducts(await pRes.json())
    setCategories(await cRes.json())
    setLoading(false)
  }, [search, categoryFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('এই পণ্য মুছতে চান?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('মুছতে পারা যায়নি')
      toast.success('পণ্য মুছে ফেলা হয়েছে')
      load()
    } catch {
      toast.error('ত্রুটি হয়েছে')
    } finally {
      setDeleting(null)
    }
  }

  const toggleFeatured = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, isFeatured: !product.isFeatured }),
      })
      toast.success('আপডেট হয়েছে')
      load()
    } catch {
      toast.error('ত্রুটি হয়েছে')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">পণ্য তালিকা</h1>
        <Link href="/admin/products/add" className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">
          + নতুন পণ্য
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="নাম, SKU বা বারকোড দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">সব ক্যাটাগরি</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">লোড হচ্ছে...</p>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">ছবি</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">নাম</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">SKU</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">বারকোড</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">ক্যাটাগরি</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">একক</th>
                <th className="text-right px-3 py-3 text-gray-600 font-medium">ক্রয়</th>
                <th className="text-right px-3 py-3 text-gray-600 font-medium">বিক্রয়</th>
                <th className="text-right px-3 py-3 text-gray-600 font-medium">স্টক</th>
                <th className="text-center px-3 py-3 text-gray-600 font-medium">ফিচার্ড</th>
                <th className="text-right px-3 py-3 text-gray-600 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">কোনো পণ্য পাওয়া যায়নি</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-lg">📦</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium max-w-[150px] truncate">{p.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{p.barcode}</td>
                    <td className="px-3 py-2 text-gray-600">{p.category?.name || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.unit}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(p.buyPrice)}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(p.sellPrice)}</td>
                    <td className="px-3 py-2 text-right">
                      {p.stock <= p.minStock ? (
                        <Badge variant="destructive">{p.stock}</Badge>
                      ) : (
                        <span className="font-medium">{p.stock}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggleFeatured(p)}
                        className={`text-lg ${p.isFeatured ? 'opacity-100' : 'opacity-30'}`}
                        title={p.isFeatured ? 'ফিচার্ড' : 'ফিচার্ড নয়'}
                      >
                        ⭐
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-blue-600 hover:underline mr-3 text-xs">এডিট</Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        মুছুন
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
