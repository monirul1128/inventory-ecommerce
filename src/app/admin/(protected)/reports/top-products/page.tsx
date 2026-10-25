'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TopProduct {
  product: { id: string; name: string; sku: string; category?: { name: string } | null }
  totalQty: number
  totalRevenue: number
}

export default function TopProductsPage() {
  const now = new Date()
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(now.toISOString().slice(0, 10))
  const [data, setData] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/reports/top-products?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const chartData = data.slice(0, 10).map(d => ({
    name: d.product.name.length > 12 ? d.product.name.slice(0, 12) + '…' : d.product.name,
    পরিমাণ: d.totalQty,
    রাজস্ব: d.totalRevenue,
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">শীর্ষ বিক্রয় পণ্য 🏆</h1>

      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">শুরু তারিখ</label>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">শেষ তারিখ</label>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={load} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">ফিল্টার</button>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <>
          {data.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">এই সময়কালে কোনো বিক্রয় নেই</div>
          ) : (
            <>
              <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
                <h2 className="font-semibold text-gray-800 mb-4">বিক্রয় চার্ট (শীর্ষ ১০)</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v: unknown) => v == null ? '' : Number(v)} />
                    <Bar dataKey="পরিমাণ" fill="#92400e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-center px-4 py-3 text-gray-600 font-medium w-12">#</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-medium">ক্যাটাগরি</th>
                      <th className="text-right px-4 py-3 text-gray-600 font-medium">বিক্রয় পরিমাণ</th>
                      <th className="text-right px-4 py-3 text-gray-600 font-medium">মোট রাজস্ব</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr key={item.product.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-center font-bold text-amber-700">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-xs text-gray-400">{item.product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.product.category?.name || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{item.totalQty}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(item.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
