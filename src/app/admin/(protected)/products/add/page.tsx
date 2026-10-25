'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { generateSKU, generateBarcode } from '@/lib/utils'
import dynamic from 'next/dynamic'

const Barcode = dynamic(() => import('react-barcode'), { ssr: false })

interface Category { id: string; name: string }
interface Supplier { id: string; name: string }

const UNITS = ['PIECE', 'KG', 'LITER', 'METER', 'SET', 'PAIR', 'BOX', 'DOZEN']

const defaultForm = {
  name: '', description: '', sku: '', barcode: '', categoryId: '', supplierId: '',
  unit: 'PIECE', buyPrice: '', sellPrice: '', stock: '0', minStock: '5',
  expiryDate: '', images: '', isFeatured: false,
}

export default function AddProductPage() {
  const router = useRouter()
  const [form, setForm] = useState(defaultForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json()),
    ]).then(([cats, sups]) => {
      setCategories(cats)
      setSuppliers(sups)
    })
    // Auto-generate SKU and barcode
    setForm(f => ({ ...f, sku: generateSKU(), barcode: generateBarcode() }))
  }, [])

  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.buyPrice || !form.sellPrice) return toast.error('নাম, ক্রয় ও বিক্রয় মূল্য প্রয়োজন')
    setSaving(true)
    try {
      const body = {
        ...form,
        buyPrice: parseFloat(form.buyPrice),
        sellPrice: parseFloat(form.sellPrice),
        stock: parseFloat(form.stock),
        minStock: parseFloat(form.minStock),
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
        expiryDate: form.expiryDate || null,
        images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('পণ্য যোগ করা হয়েছে')
      router.push('/admin/products')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">নতুন পণ্য যোগ</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">← ফিরে যান</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.name} onChange={e => set('name', e.target.value)} placeholder="পণ্যের নাম" required />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="পণ্যের বিবরণ" />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                value={form.sku} onChange={e => set('sku', e.target.value)} />
              <button type="button" onClick={() => set('sku', generateSKU())}
                className="px-3 py-2 text-xs bg-gray-100 border rounded-lg hover:bg-gray-200">অটো</button>
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বারকোড</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                value={form.barcode} onChange={e => set('barcode', e.target.value)} />
              <button type="button" onClick={() => set('barcode', generateBarcode())}
                className="px-3 py-2 text-xs bg-gray-100 border rounded-lg hover:bg-gray-200">অটো</button>
            </div>
            {form.barcode && (
              <div className="mt-2 p-2 bg-white border rounded flex justify-center">
                <Barcode value={form.barcode} height={40} fontSize={10} />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">— ক্যাটাগরি বেছে নিন —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">সাপ্লায়ার</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
              <option value="">— সাপ্লায়ার বেছে নিন —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">একক</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.unit} onChange={e => set('unit', e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Buy Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ক্রয় মূল্য (৳) *</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} placeholder="0" required />
          </div>

          {/* Sell Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বিক্রয় মূল্য (৳) *</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} placeholder="0" required />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">স্টক</label>
            <input type="number" min="0" step="0.001" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.stock} onChange={e => set('stock', e.target.value)} />
          </div>

          {/* Min Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নূন্যতম স্টক</label>
            <input type="number" min="0" step="0.001" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.minStock} onChange={e => set('minStock', e.target.value)} />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">মেয়াদ তারিখ</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
          </div>

          {/* Images */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ছবির URL (কমা দিয়ে আলাদা করুন)</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.images} onChange={e => set('images', e.target.value)}
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
          </div>

          {/* Featured */}
          <div className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.isFeatured}
              onChange={e => set('isFeatured', e.target.checked)}
              className="w-4 h-4 accent-amber-700" />
            <label htmlFor="featured" className="text-sm text-gray-700">ফিচার্ড পণ্য</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">বাতিল</button>
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'পণ্য যোগ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
