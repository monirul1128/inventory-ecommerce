'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Expense {
  id: string
  category: string
  amount: number
  note: string | null
  date: string
}

const CATEGORIES = ['ভাড়া', 'বেতন', 'বিদ্যুৎ', 'পানি', 'ইন্টারনেট', 'পরিবহন', 'বিজ্ঞাপন', 'মেরামত', 'অন্যান্য']

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [form, setForm] = useState({ category: '', amount: '', note: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/expenses')
    setExpenses(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category || !form.amount) return toast.error('ক্যাটাগরি ও পরিমাণ প্রয়োজন')
    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('খরচ সংরক্ষিত হয়েছে')
      setForm({ category: '', amount: '', note: '', date: new Date().toISOString().slice(0, 10) })
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayExpenses = expenses.filter(e => e.date.slice(0, 10) === today)
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-900">খরচ এন্ট্রি 💸</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Expense Form */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 h-fit">
          <h2 className="font-semibold text-gray-800 mb-4">নতুন খরচ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                <option value="">— বেছে নিন —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="custom">অন্য (নিচে লিখুন)</option>
              </select>
              {form.category === 'custom' && (
                <input className="w-full mt-2 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ক্যাটাগরির নাম" onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳) *</label>
              <input type="number" min="0.01" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="ঐচ্ছিক নোট" />
            </div>
            <button type="submit" disabled={saving} className="w-full py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 font-medium text-sm disabled:opacity-50">
              {saving ? 'সংরক্ষণ হচ্ছে...' : '✅ খরচ যোগ করুন'}
            </button>
          </form>
        </div>

        {/* Today's Summary */}
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">আজকের মোট খরচ</p>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(todayTotal)}</p>
          </div>

          <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-800 text-sm">আজকের খরচ তালিকা</div>
            {todayExpenses.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">আজ কোনো খরচ নেই</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {todayExpenses.map(e => (
                    <tr key={e.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{e.category}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{e.note || ''}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* All Expenses */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <div className="p-4 border-b font-semibold text-gray-800">সব খরচ</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">ক্যাটাগরি</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিমাণ</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">নোট</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">কোনো খরচ নেই</td></tr>
            ) : expenses.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-gray-500">{e.note || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(e.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
