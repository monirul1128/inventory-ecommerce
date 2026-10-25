'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PurchaseItem {
  id: string
  qty: number
  buyPrice: number
  total: number
  product: { name: string; sku: string; unit: string }
}

interface Purchase {
  id: string
  invoiceNo: string
  date: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  note: string | null
  supplier: { name: string; phone: string }
  items: PurchaseItem[]
}

interface Supplier { id: string; name: string }

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [selected, setSelected] = useState<Purchase | null>(null)

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers)
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/purchases')
    const data = await res.json()
    setPurchases(data)
    setLoading(false)
  }

  const filtered = purchases.filter(p => {
    if (supplierFilter && p.supplier?.name.toLowerCase().indexOf(supplierFilter.toLowerCase()) === -1) return false
    if (dateFrom && new Date(p.date) < new Date(dateFrom)) return false
    if (dateTo && new Date(p.date) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">ক্রয় ইতিহাস</h1>

      <div className="flex gap-3 flex-wrap">
        <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="শুরু তারিখ" />
        <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="শেষ তারিখ" />
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">সব সাপ্লায়ার</option>
          {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <button onClick={load} className="px-4 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200">রিফ্রেশ</button>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">চালান নং</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">সাপ্লায়ার</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">মোট</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিশোধ</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বাকি</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">কোনো ক্রয় নেই</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.invoiceNo}</td>
                  <td className="px-4 py-3">{p.supplier?.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(p.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(p.dueAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(p)} className="text-blue-600 hover:underline text-xs">দেখুন</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">ক্রয় বিস্তারিত</h2>
                <p className="text-sm text-gray-500 font-mono">{selected.invoiceNo}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">সাপ্লায়ার:</span> <strong>{selected.supplier?.name}</strong></div>
                <div><span className="text-gray-500">তারিখ:</span> <strong>{formatDate(selected.date)}</strong></div>
                {selected.note && <div className="col-span-2"><span className="text-gray-500">নোট:</span> {selected.note}</div>}
              </div>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-600">পণ্য</th>
                    <th className="text-right px-3 py-2 text-gray-600">পরিমাণ</th>
                    <th className="text-right px-3 py-2 text-gray-600">মূল্য</th>
                    <th className="text-right px-3 py-2 text-gray-600">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-2">{item.product.name}</td>
                      <td className="px-3 py-2 text-right">{item.qty} {item.product.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.buyPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm text-right">
                <div>মোট: <strong>{formatCurrency(selected.totalAmount)}</strong></div>
                <div className="text-green-600">পরিশোধ: {formatCurrency(selected.paidAmount)}</div>
                <div className="text-red-600">বাকি: {formatCurrency(selected.dueAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
