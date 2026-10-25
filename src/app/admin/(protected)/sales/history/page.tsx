'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface SaleItem {
  id: string
  qty: number
  sellPrice: number
  total: number
  product: { name: string; unit: string }
}

interface Sale {
  id: string
  invoiceNo: string
  date: string
  total: number
  paidAmount: number
  dueAmount: number
  discount: number
  vat: number
  paymentMethod: string
  customer?: { name: string; phone: string } | null
  items: SaleItem[]
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<Sale | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/sales')
    setSales(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = sales.filter(s => {
    if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false
    if (dateTo && new Date(s.date) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const paymentBadge = (method: string) => {
    const map: Record<string, string> = {
      CASH: 'bg-green-100 text-green-700',
      CREDIT: 'bg-red-100 text-red-700',
      BKASH: 'bg-pink-100 text-pink-700',
      NAGAD: 'bg-orange-100 text-orange-700',
      CARD: 'bg-blue-100 text-blue-700',
    }
    return map[method] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">বিক্রয় ইতিহাস</h1>

      <div className="flex gap-3 flex-wrap">
        <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button onClick={load} className="px-4 py-2 bg-gray-100 border rounded-lg text-sm hover:bg-gray-200">রিফ্রেশ</button>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">চালান নং</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">কাস্টমার</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">মোট</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিশোধ</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বাকি</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পেমেন্ট</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">কোনো বিক্রয় নেই</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.invoiceNo}</td>
                  <td className="px-4 py-3">{s.customer?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(s.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(s.dueAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${paymentBadge(s.paymentMethod)}`}>{s.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setSelected(s)} className="text-blue-600 hover:underline text-xs">দেখুন</button>
                    <Link href={`/admin/invoices/${s.id}`} target="_blank" className="text-amber-700 hover:underline text-xs">প্রিন্ট</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">বিক্রয় বিস্তারিত</h2>
                <p className="text-sm text-gray-500 font-mono">{selected.invoiceNo}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/invoices/${selected.id}`} target="_blank" className="text-sm text-amber-700 hover:underline">🖨️ প্রিন্ট</Link>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">কাস্টমার:</span> {selected.customer?.name || '—'}</div>
                <div><span className="text-gray-500">তারিখ:</span> {formatDate(selected.date)}</div>
                <div><span className="text-gray-500">পেমেন্ট:</span> <Badge variant="secondary">{selected.paymentMethod}</Badge></div>
              </div>
              <table className="w-full text-sm border rounded overflow-hidden">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2">পণ্য</th>
                    <th className="text-right px-3 py-2">পরিমাণ</th>
                    <th className="text-right px-3 py-2">মূল্য</th>
                    <th className="text-right px-3 py-2">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-2">{item.product.name}</td>
                      <td className="px-3 py-2 text-right">{item.qty} {item.product.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.sellPrice)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-sm text-right space-y-1">
                <div>সাবটোটাল: {formatCurrency(selected.total + selected.discount - selected.vat)}</div>
                {selected.discount > 0 && <div className="text-orange-600">ডিসকাউন্ট: − {formatCurrency(selected.discount)}</div>}
                {selected.vat > 0 && <div>ভ্যাট: {formatCurrency(selected.vat)}</div>}
                <div className="font-bold text-base">মোট: {formatCurrency(selected.total)}</div>
                <div className="text-green-600">পরিশোধ: {formatCurrency(selected.paidAmount)}</div>
                {selected.dueAmount > 0 && <div className="text-red-600">বাকি: {formatCurrency(selected.dueAmount)}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
