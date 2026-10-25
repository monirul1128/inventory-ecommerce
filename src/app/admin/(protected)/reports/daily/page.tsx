'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DailyReport {
  date: string
  totalSales: number
  totalCOGS: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  sales: { id: string; invoiceNo: string; total: number; paymentMethod: string; customer?: { name: string } | null }[]
  expenses: { id: string; category: string; amount: number; note: string | null }[]
}

export default function DailyReportPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/reports/daily?date=${date}`)
    setReport(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [date])

  const kpis = report ? [
    { label: 'মোট বিক্রয়', value: report.totalSales, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'মোট COGS', value: report.totalCOGS, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'গ্রস লাভ', value: report.grossProfit, color: report.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: 'bg-emerald-50' },
    { label: 'মোট খরচ', value: report.totalExpenses, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'নিট লাভ', value: report.netProfit, color: report.netProfit >= 0 ? 'text-amber-700' : 'text-red-600', bg: 'bg-amber-50' },
  ] : []

  const chartData = report ? [
    { name: 'বিক্রয়', amount: report.totalSales },
    { name: 'COGS', amount: report.totalCOGS },
    { name: 'গ্রস লাভ', amount: report.grossProfit },
    { name: 'খরচ', amount: report.totalExpenses },
    { name: 'নিট লাভ', amount: report.netProfit },
  ] : []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-amber-900">দৈনিক রিপোর্ট</h1>
        <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : report && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className={`rounded-xl p-4 ${kpi.bg}`}>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color}`}>{formatCurrency(kpi.value)}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
            <h2 className="font-semibold text-gray-800 mb-4">অর্থনৈতিক সংক্ষেপ</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number | undefined) => v == null ? '' : `৳${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => v == null ? '' : formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="#92400e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales */}
            <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
              <div className="p-4 border-b font-semibold text-gray-800">বিক্রয় ({report.sales.length})</div>
              {report.sales.length === 0 ? <p className="text-center py-6 text-gray-400 text-sm">আজ কোনো বিক্রয় নেই</p> : (
                <table className="w-full text-sm">
                  <tbody>
                    {report.sales.map(s => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{s.invoiceNo}</td>
                        <td className="px-4 py-2 text-gray-600">{s.customer?.name || '—'}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
              <div className="p-4 border-b font-semibold text-gray-800">খরচ ({report.expenses.length})</div>
              {report.expenses.length === 0 ? <p className="text-center py-6 text-gray-400 text-sm">আজ কোনো খরচ নেই</p> : (
                <table className="w-full text-sm">
                  <tbody>
                    {report.expenses.map(e => (
                      <tr key={e.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{e.category}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{e.note || ''}</td>
                        <td className="px-4 py-2 text-right text-red-600 font-medium">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
