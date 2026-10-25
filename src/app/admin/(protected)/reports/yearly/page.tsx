'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthData {
  month: string
  totalSales: number
  totalCOGS: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
}

const MONTH_LABELS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']

export default function YearlyReportPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState<{ year: number; monthlyData: MonthData[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports/yearly?year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [year])

  const totalSales = data?.monthlyData.reduce((s, m) => s + m.totalSales, 0) || 0
  const totalProfit = data?.monthlyData.reduce((s, m) => s + m.netProfit, 0) || 0
  const totalExpenses = data?.monthlyData.reduce((s, m) => s + m.totalExpenses, 0) || 0

  const chartData = (data?.monthlyData || []).map((m, i) => ({
    name: MONTH_LABELS[i],
    বিক্রয়: m.totalSales,
    লাভ: m.netProfit,
    খরচ: m.totalExpenses,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-amber-900">বার্ষিক রিপোর্ট</h1>
        <input type="number" min="2000" max="2100" className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={year} onChange={e => setYear(parseInt(e.target.value))} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">বার্ষিক বিক্রয়</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-gray-500">বার্ষিক খরচ</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p></div>
        <div className={`rounded-xl p-4 ${totalProfit >= 0 ? 'bg-amber-50' : 'bg-red-50'}`}><p className="text-xs text-gray-500">বার্ষিক লাভ</p><p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p></div>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <>
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
            <h2 className="font-semibold text-gray-800 mb-4">মাসভিত্তিক চার্ট — {year}</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number | undefined) => v == null ? '' : `৳${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => v == null ? '' : formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="বিক্রয়" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="লাভ" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="খরচ" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-800">মাসভিত্তিক তুলনা</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">মাস</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">বিক্রয়</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">COGS</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">খরচ</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">নিট লাভ</th>
                </tr>
              </thead>
              <tbody>
                {data?.monthlyData.map((m, i) => (
                  <tr key={m.month} className={`border-b hover:bg-gray-50 ${m.totalSales === 0 ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2">{MONTH_LABELS[i]}</td>
                    <td className="px-4 py-2 text-right text-green-600">{formatCurrency(m.totalSales)}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(m.totalCOGS)}</td>
                    <td className="px-4 py-2 text-right text-red-600">{formatCurrency(m.totalExpenses)}</td>
                    <td className={`px-4 py-2 text-right font-bold ${m.netProfit >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{formatCurrency(m.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
