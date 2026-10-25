'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DayData {
  date: string
  totalSales: number
  totalCOGS: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
}

interface MonthlyReport {
  year: number
  month: number
  dailyData: DayData[]
}

const MONTHS = [
  { value: 1, label: 'জানুয়ারি' }, { value: 2, label: 'ফেব্রুয়ারি' }, { value: 3, label: 'মার্চ' },
  { value: 4, label: 'এপ্রিল' }, { value: 5, label: 'মে' }, { value: 6, label: 'জুন' },
  { value: 7, label: 'জুলাই' }, { value: 8, label: 'আগস্ট' }, { value: 9, label: 'সেপ্টেম্বর' },
  { value: 10, label: 'অক্টোবর' }, { value: 11, label: 'নভেম্বর' }, { value: 12, label: 'ডিসেম্বর' },
]

export default function MonthlyReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports/monthly?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false) })
  }, [year, month])

  const totalSales = report?.dailyData.reduce((s, d) => s + d.totalSales, 0) || 0
  const totalProfit = report?.dailyData.reduce((s, d) => s + d.netProfit, 0) || 0
  const totalExpenses = report?.dailyData.reduce((s, d) => s + d.totalExpenses, 0) || 0

  const chartData = (report?.dailyData || [])
    .filter(d => d.totalSales > 0 || d.netProfit !== 0)
    .map(d => ({ date: d.date.slice(8), বিক্রয়: d.totalSales, লাভ: d.netProfit, খরচ: d.totalExpenses }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-amber-900">মাসিক রিপোর্ট</h1>
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input type="number" min="2000" max="2100" className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={year} onChange={e => setYear(parseInt(e.target.value))} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-gray-500">মোট বিক্রয়</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-gray-500">মোট খরচ</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p></div>
        <div className={`rounded-xl p-4 ${totalProfit >= 0 ? 'bg-amber-50' : 'bg-red-50'}`}><p className="text-xs text-gray-500">নিট লাভ</p><p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p></div>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">দিনভিত্তিক চার্ট</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number | undefined) => v == null ? '' : `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => v == null ? '' : formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="বিক্রয়" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="লাভ" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="খরচ" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
