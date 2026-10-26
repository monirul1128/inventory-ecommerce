'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { generateSKU, generateBarcode } from '@/lib/utils'
import { ImageUpload } from '@/components/image-upload'
import dynamic from 'next/dynamic'

const Barcode = dynamic(() => import('react-barcode'), { ssr: false })

interface Category { id: string; name: string }
interface Supplier { id: string; name: string }

const UNITS = ['PIECE', 'KG', 'LITER', 'METER', 'SET', 'PAIR', 'BOX', 'DOZEN']

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState({
    name: '', description: '', sku: '', barcode: '', categoryId: '', supplierId: '',
    unit: 'PIECE', buyPrice: '', sellPrice: '', stock: '0', minStock: '5',
    expiryDate: '', warranty: '', images: [] as string[], isFeatured: false,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const set = (key: string, val: string | boolean | string[]) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json()),
    ]).then(([product, cats, sups]) => {
      setCategories(cats)
      setSuppliers(sups)
      if (product.id) {
        setForm({
          name: product.name || '',
          description: product.description || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryId: product.categoryId || '',
          supplierId: product.supplierId || '',
          unit: product.unit || 'PIECE',
          buyPrice: String(product.buyPrice ?? ''),
          sellPrice: String(product.sellPrice ?? ''),
          stock: String(product.stock ?? '0'),
          minStock: String(product.minStock ?? '5'),
          expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
          warranty: product.warranty || '',
          images: Array.isArray(product.images) ? product.images : [],
          isFeatured: product.isFeatured || false,
        })
      }
      setLoading(false)
    })
  }, [id])

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
        warranty: form.warranty || null,
        images: form.images,
      }
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('পণ্য আপডেট হয়েছে')
      router.push('/admin/products')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-400">লোড হচ্ছে...</p>

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">পণ্য এডিট</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">← ফিরে যান</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.name} onChange={e => set('name', e.target.value)} placeholder="পণ্যের নাম" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                value={form.sku} onChange={e => set('sku', e.target.value)} />
              <button type="button" onClick={() => set('sku', generateSKU())} className="px-3 py-2 text-xs bg-gray-100 border rounded-lg hover:bg-gray-200">অটো</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বারকোড</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                value={form.barcode} onChange={e => set('barcode', e.target.value)} />
              <button type="button" onClick={() => set('barcode', generateBarcode())} className="px-3 py-2 text-xs bg-gray-100 border rounded-lg hover:bg-gray-200">অটো</button>
            </div>
            {form.barcode && (
              <div className="mt-2 p-2 bg-white border rounded flex justify-center">
                <Barcode value={form.barcode} height={40} fontSize={10} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">— ক্যাটাগরি বেছে নিন —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">সাপ্লায়ার</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
              <option value="">— সাপ্লায়ার বেছে নিন —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">একক</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.unit} onChange={e => set('unit', e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ক্রয় মূল্য (৳) *</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বিক্রয় মূল্য (৳) *</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">স্টক</label>
            <input type="number" min="0" step="0.001" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.stock} onChange={e => set('stock', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নূন্যতম স্টক</label>
            <input type="number" min="0" step="0.001" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.minStock} onChange={e => set('minStock', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">মেয়াদ তারিখ</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ওয়ারেন্টি</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.warranty} onChange={e => set('warranty', e.target.value)} 
              placeholder="যেমন: ১ বছর, ৬ মাস, ২ বছর" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">পণ্যের ছবি</label>
            <ImageUpload
              images={form.images}
              onChange={(images) => set('images', images)}
              maxImages={5}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.isFeatured}
              onChange={e => set('isFeatured', e.target.checked)} className="w-4 h-4 accent-amber-700" />
            <label htmlFor="featured" className="text-sm text-gray-700">ফিচার্ড পণ্য</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">বাতিল</button>
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
            {saving ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
