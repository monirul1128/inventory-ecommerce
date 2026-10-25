'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Payment {
  id: string
  type: string
  amount: number
  method: string
  note: string | null
  date: string
  referenceId: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const url = typeFilter ? `/api/payments?type=${typeFilter}` : '/api/payments'
    setLoading(true)
    fetch(url).then(r => r.json()).then(data => { setPayments(data); setLoading(false) })
  }, [typeFilter])

  const totalIn = payments.filter(p => p.type === 'CUSTOMER').reduce((s, p) => s + p.amount, 0)
  const totalOut = payments.filter(p => p.type === 'SUPPLIER').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">পেমেন্ট লেজার</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500">কাস্টমার পেমেন্ট (আয়)</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIn)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-gray-500">সাপ্লায়ার পেমেন্ট (ব্যয়)</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOut)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[{ value: '', label: 'সব' }, { value: 'CUSTOMER', label: 'কাস্টমার' }, { value: 'SUPPLIER', label: 'সাপ্লায়ার' }].map(t => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${typeFilter === t.value ? 'bg-amber-900 text-white border-amber-900' : 'border-gray-200 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ধরন</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিমাণ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পদ্ধতি</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">নোট</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">কোনো পেমেন্ট নেই</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.type === 'CUSTOMER' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.type === 'CUSTOMER' ? 'কাস্টমার' : 'সাপ্লায়ার'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${p.type === 'CUSTOMER' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.method}</td>
                  <td className="px-4 py-3 text-gray-500">{p.note || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
