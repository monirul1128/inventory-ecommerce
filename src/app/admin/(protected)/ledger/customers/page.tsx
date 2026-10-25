'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Customer { id: string; name: string; phone: string; balance: number }
interface Payment { id: string; amount: number; method: string; note: string | null; date: string; referenceId: string }

export default function CustomerLedgerPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selected, setSelected] = useState<Customer | null>(null)
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', note: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [cRes, pRes] = await Promise.all([
      fetch('/api/customers'),
      fetch('/api/payments?type=CUSTOMER'),
    ])
    setCustomers(await cRes.json())
    setPayments(await pRes.json())
  }

  useEffect(() => { load() }, [])

  const handlePayment = async () => {
    if (!selected || !payForm.amount) return toast.error('পরিমাণ দিন')
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CUSTOMER',
          referenceId: selected.id,
          amount: parseFloat(payForm.amount),
          method: payForm.method,
          note: payForm.note,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('পেমেন্ট সংরক্ষিত হয়েছে')
      setPayForm({ amount: '', method: 'CASH', note: '' })
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const totalDue = customers.reduce((s, c) => s + c.balance, 0)
  const withBalance = customers.filter(c => c.balance > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">কাস্টমার বাকি খাতা</h1>
        <div className="bg-red-50 px-4 py-2 rounded-lg text-sm">
          মোট বাকি: <strong className="text-red-600">{formatCurrency(totalDue)}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer List */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="p-4 border-b font-semibold text-gray-800">বাকি কাস্টমার ({withBalance.length})</div>
          <div className="divide-y">
            {withBalance.length === 0 ? (
              <p className="text-center py-8 text-gray-400">কোনো বাকি নেই</p>
            ) : withBalance.map(c => (
              <div key={c.id}
                className={`p-4 flex justify-between items-center cursor-pointer hover:bg-amber-50 transition-colors ${selected?.id === c.id ? 'bg-amber-50' : ''}`}
                onClick={() => setSelected(c)}>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{formatCurrency(c.balance)}</p>
                  <button
                    onClick={e => { e.stopPropagation(); window.open(`https://wa.me/88${c.phone}?text=${encodeURIComponent(`আপনার বাকি আছে ${formatCurrency(c.balance)}। অনুগ্রহ করে পরিশোধ করুন।`)}`, '_blank') }}
                    className="text-xs text-green-600 hover:underline mt-0.5">
                    📱 WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        {selected && (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 space-y-4 h-fit">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-gray-800">পেমেন্ট নিন</h2>
                <p className="text-sm text-gray-500">{selected.name}</p>
              </div>
              <Badge variant="destructive">বাকি: {formatCurrency(selected.balance)}</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ *</label>
                <input type="number" min="0.01" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পেমেন্ট পদ্ধতি</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                  <option value="CASH">নগদ</option>
                  <option value="BKASH">বিকাশ</option>
                  <option value="NAGAD">নগদ (অ্যাপ)</option>
                  <option value="CARD">কার্ড</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} placeholder="ঐচ্ছিক নোট" />
              </div>
              <button onClick={handlePayment} disabled={saving}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50">
                {saving ? 'সংরক্ষণ হচ্ছে...' : '✅ পেমেন্ট নিন'}
              </button>
            </div>

            {/* Payment History for selected customer */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">পেমেন্ট ইতিহাস</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {payments.filter(p => p.referenceId === selected.id).map(p => (
                  <div key={p.id} className="flex justify-between text-xs py-1 border-b">
                    <span>{formatDate(p.date)} — {p.method}</span>
                    <span className="text-green-600 font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
