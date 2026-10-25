'use client'
import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

interface StockMovement {
  id: string
  type: string
  qty: number
  note: string | null
  date: string
  product: { name: string; sku: string; unit: string; category?: { name: string } | null }
}

const TYPE_COLORS: Record<string, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
  RETURN: 'bg-blue-100 text-blue-700',
  DAMAGE: 'bg-orange-100 text-orange-700',
  ADJUSTMENT: 'bg-gray-100 text-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  IN: 'ইন',
  OUT: 'আউট',
  RETURN: 'ফেরত',
  DAMAGE: 'নষ্ট',
  ADJUSTMENT: 'সমন্বয়',
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/stock/movements')
      .then(r => r.json())
      .then(data => { setMovements(data); setLoading(false) })
  }, [])

  const filtered = typeFilter ? movements.filter(m => m.type === typeFilter) : movements

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">স্টক মুভমেন্ট</h1>

      <div className="flex gap-2 flex-wrap">
        {['', 'IN', 'OUT', 'RETURN', 'DAMAGE', 'ADJUSTMENT'].map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${typeFilter === type ? 'bg-amber-900 text-white border-amber-900' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            {type === '' ? 'সব' : TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ধরন</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিমাণ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">নোট</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">কোনো মুভমেন্ট নেই</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.product?.name}</div>
                    <div className="text-xs text-gray-400">{m.product?.sku}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${TYPE_COLORS[m.type] || 'bg-gray-100'}`}>
                      {TYPE_LABELS[m.type] || m.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${m.type === 'OUT' || m.type === 'DAMAGE' ? 'text-red-600' : 'text-green-600'}`}>
                    {m.type === 'OUT' || m.type === 'DAMAGE' ? '−' : '+'}{m.qty} {m.product?.unit}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{m.note || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(m.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
