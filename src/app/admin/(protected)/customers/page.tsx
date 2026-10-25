'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  balance: number
}

const defaultForm = { name: '', phone: '', email: '', address: '' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/customers')
    setCustomers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowDialog(true) }
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '' }); setShowDialog(true) }

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.error('নাম ও ফোন প্রয়োজন')
    setSaving(true)
    try {
      const url = editing ? `/api/customers/${editing.id}` : '/api/customers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? 'আপডেট হয়েছে' : 'যোগ করা হয়েছে')
      setShowDialog(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('মুছে ফেলবেন?')) return
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    toast.success('মুছে ফেলা হয়েছে')
    load()
  }

  const sendWhatsApp = (customer: Customer) => {
    const msg = encodeURIComponent(`আপনার বাকি আছে ${formatCurrency(customer.balance)}। অনুগ্রহ করে পরিশোধ করুন।`)
    window.open(`https://wa.me/88${customer.phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">কাস্টমার</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">+ নতুন কাস্টমার</button>
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">নাম</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ফোন</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ইমেইল</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ঠিকানা</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বাকি</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">কোনো কাস্টমার নেই</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{c.address || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.balance > 0 ? (
                      <span className="font-medium text-red-600">{formatCurrency(c.balance)}</span>
                    ) : (
                      <Badge variant="secondary">পরিষ্কার</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {c.balance > 0 && (
                      <button onClick={() => sendWhatsApp(c)} className="text-green-600 hover:underline text-xs" title="WhatsApp রিমাইন্ডার">📱</button>
                    )}
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-xs">এডিট</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-xs">মুছুন</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b"><h2 className="text-lg font-semibold">{editing ? 'কাস্টমার এডিট' : 'নতুন কাস্টমার'}</h2></div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'নাম *', placeholder: 'কাস্টমারের নাম' },
                { key: 'phone', label: 'ফোন *', placeholder: '01XXXXXXXXX' },
                { key: 'email', label: 'ইমেইল', placeholder: 'email@example.com' },
                { key: 'address', label: 'ঠিকানা', placeholder: 'ঠিকানা লিখুন' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowDialog(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">বাতিল</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
                {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
