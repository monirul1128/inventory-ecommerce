'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Product { id: string; name: string; sku: string; unit: string; buyPrice: number }
interface DamagedStock {
  id: string
  qty: number
  reason: string | null
  date: string
  product: { name: string; buyPrice: number; unit: string }
}

export default function DamagedStockPage() {
  const [damaged, setDamaged] = useState<DamagedStock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({ productId: '', qty: '1', reason: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [dRes, pRes] = await Promise.all([
      fetch('/api/stock/damaged'),
      fetch('/api/products'),
    ])
    setDamaged(await dRes.json())
    setProducts(await pRes.json())
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId || !form.qty) return toast.error('পণ্য ও পরিমাণ প্রয়োজন')
    setSaving(true)
    try {
      const res = await fetch('/api/stock/damaged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, qty: parseFloat(form.qty) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('নষ্ট মাল এন্ট্রি হয়েছে')
      setForm({ productId: '', qty: '1', reason: '', date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const totalLoss = damaged.reduce((s, d) => s + d.qty * (d.product?.buyPrice || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">নষ্ট/ড্যামেজ মাল 🗑️</h1>
        <div className="bg-red-50 px-4 py-2 rounded-lg text-sm">
          মোট ক্ষতি: <strong className="text-red-600">{formatCurrency(totalLoss)}</strong>
        </div>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">নতুন ড্যামেজ এন্ট্রি</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পণ্য *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} required>
              <option value="">— পণ্য বেছে নিন —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ *</label>
            <input type="number" min="0.001" step="0.001" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">কারণ</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="নষ্ট হওয়ার কারণ" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
              {saving ? 'সংরক্ষণ হচ্ছে...' : '🗑️ ড্যামেজ এন্ট্রি করুন'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold text-gray-800">নষ্ট মালের তালিকা</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিমাণ</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">ক্ষতির পরিমাণ</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">কারণ</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {damaged.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">কোনো ড্যামেজ এন্ট্রি নেই</td></tr>
            ) : damaged.map(d => (
              <tr key={d.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{d.product?.name}</td>
                <td className="px-4 py-3 text-right">{d.qty} {d.product?.unit}</td>
                <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(d.qty * (d.product?.buyPrice || 0))}</td>
                <td className="px-4 py-3 text-gray-500">{d.reason || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(d.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
