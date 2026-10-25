'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface CashRegister {
  id: string
  date: string
  openingBalance: number
  closingBalance: number | null
  totalSales: number
  totalExpenses: number
  totalPurchases: number
  note: string | null
}

export default function CashPage() {
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState('0')
  const [closing, setClosing] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/cash-register')
    const data = await res.json()
    setRegister(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleOpen = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingBalance: parseFloat(opening), note }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('ক্যাশ রেজিস্টার খোলা হয়েছে')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async () => {
    if (!closing) return toast.error('ক্লোজিং ব্যালেন্স দিন')
    setSaving(true)
    try {
      const res = await fetch('/api/cash-register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingBalance: parseFloat(closing) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('ক্যাশ রেজিস্টার বন্ধ করা হয়েছে')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const cashOnHand = register
    ? register.openingBalance + register.totalSales - register.totalExpenses - register.totalPurchases
    : 0

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-amber-900">ক্যাশ রেজিস্টার 💰</h1>
      <p className="text-sm text-gray-500">{today}</p>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : !register ? (
        /* Open Register */
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">আজকের ক্যাশ রেজিস্টার খুলুন</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">শুরুর ব্যালেন্স (৳)</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={opening} onChange={e => setOpening(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={note} onChange={e => setNote(e.target.value)} placeholder="ঐচ্ছিক নোট" />
          </div>
          <button onClick={handleOpen} disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold disabled:opacity-50">
            {saving ? 'খোলা হচ্ছে...' : '🔓 ক্যাশ রেজিস্টার খুলুন'}
          </button>
        </div>
      ) : (
        /* Register Summary */
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'শুরুর ব্যালেন্স', value: register.openingBalance, color: 'text-gray-700' },
              { label: 'মোট বিক্রয়', value: register.totalSales, color: 'text-green-600' },
              { label: 'মোট খরচ', value: register.totalExpenses, color: 'text-red-600' },
              { label: 'মোট ক্রয়', value: register.totalPurchases, color: 'text-orange-600' },
              { label: 'হাতে নগদ (আনুমানিক)', value: cashOnHand, color: 'text-amber-700' },
              { label: 'ক্লোজিং ব্যালেন্স', value: register.closingBalance ?? 0, color: register.closingBalance ? 'text-blue-600' : 'text-gray-300' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>

          {register.note && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">নোট: {register.note}</div>
          )}

          {!register.closingBalance && (
            <div className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-800">দিন শেষ করুন</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ক্লোজিং ব্যালেন্স (৳)</label>
                <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={closing} onChange={e => setClosing(e.target.value)} placeholder={String(cashOnHand)} />
              </div>
              <button onClick={handleClose} disabled={saving}
                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold disabled:opacity-50">
                {saving ? 'বন্ধ হচ্ছে...' : '🔒 ক্যাশ রেজিস্টার বন্ধ করুন'}
              </button>
            </div>
          )}

          {register.closingBalance && (
            <div className="bg-green-50 rounded-xl p-4 text-center text-green-700 font-medium">
              ✅ আজকের ক্যাশ রেজিস্টার বন্ধ করা হয়েছে।
            </div>
          )}
        </div>
      )}
    </div>
  )
}
