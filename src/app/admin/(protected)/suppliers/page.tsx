'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  balance: number
}

const defaultForm = { name: '', phone: '', email: '', address: '' }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/suppliers')
    setSuppliers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowDialog(true) }
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, phone: s.phone, email: s.email || '', address: s.address || '' }); setShowDialog(true) }

  const handleSave = async () => {
    if (!form.name || !form.phone) return toast.error('নাম ও ফোন প্রয়োজন')
    setSaving(true)
    try {
      const url = editing ? `/api/suppliers/${editing.id}` : '/api/suppliers'
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
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
    toast.success('মুছে ফেলা হয়েছে')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">সাপ্লায়ার</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">+ নতুন সাপ্লায়ার</button>
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
              {suppliers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">কোনো সাপ্লায়ার নেই</td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    <a href={`https://wa.me/88${s.phone}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                      <span>📱</span>{s.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{s.address || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(s.balance)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline mr-3 text-xs">এডিট</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-xs">মুছুন</button>
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
            <div className="p-6 border-b"><h2 className="text-lg font-semibold">{editing ? 'সাপ্লায়ার এডিট' : 'নতুন সাপ্লায়ার'}</h2></div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'নাম *', placeholder: 'সাপ্লায়ারের নাম' },
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
