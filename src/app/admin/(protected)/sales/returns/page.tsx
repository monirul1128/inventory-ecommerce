'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Sale { id: string; invoiceNo: string; customer?: { name: string } | null }
interface Product { id: string; name: string; sku: string; sellPrice: number }
interface SaleReturn {
  id: string
  qty: number
  reason: string | null
  date: string
  sale: { invoiceNo: string; customer?: { name: string } | null }
  product: { name: string; sellPrice: number }
}

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({ saleId: '', productId: '', qty: '1', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [rRes, sRes, pRes] = await Promise.all([
      fetch('/api/sales/returns'),
      fetch('/api/sales'),
      fetch('/api/products'),
    ])
    setReturns(await rRes.json())
    setSales(await sRes.json())
    setProducts(await pRes.json())
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.saleId || !form.productId || !form.qty) return toast.error('সব তথ্য পূরণ করুন')
    setSaving(true)
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, qty: parseFloat(form.qty) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('বিক্রয় ফেরত সংরক্ষিত হয়েছে')
      setForm({ saleId: '', productId: '', qty: '1', reason: '' })
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-900">বিক্রয় ফেরত (Sales Return)</h1>

      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">নতুন ফেরত এন্ট্রি</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বিক্রয় চালান *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.saleId} onChange={e => setForm(f => ({ ...f, saleId: e.target.value }))} required>
              <option value="">— চালান বেছে নিন —</option>
              {sales.map(s => <option key={s.id} value={s.id}>{s.invoiceNo} {s.customer ? `— ${s.customer.name}` : ''}</option>)}
            </select>
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">কারণ</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="ফেরতের কারণ" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm disabled:opacity-50">
              {saving ? 'সংরক্ষণ হচ্ছে...' : '✅ ফেরত এন্ট্রি করুন'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold text-gray-800">ফেরত তালিকা</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">চালান</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিমাণ</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">মূল্য</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">কারণ</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">কোনো ফেরত নেই</td></tr>
            ) : returns.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.sale?.invoiceNo}</td>
                <td className="px-4 py-3">{r.product?.name}</td>
                <td className="px-4 py-3 text-right">{r.qty}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(r.qty * (r.product?.sellPrice || 0))}</td>
                <td className="px-4 py-3 text-gray-500">{r.reason || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
