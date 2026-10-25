'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { generateSlug } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  parentId: string | null
  parent?: { id: string; name: string } | null
  children?: Category[]
  _count?: { products: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', parentId: '', image: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', parentId: '', image: '' })
    setShowDialog(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, parentId: cat.parentId || '', image: cat.image || '' })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('নাম প্রয়োজন')
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        parentId: form.parentId || null,
        image: form.image || null,
      }
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success(editing ? 'আপডেট হয়েছে' : 'যোগ করা হয়েছে')
      setShowDialog(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('এই ক্যাটাগরি মুছতে চান?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('মুছতে পারা যায়নি')
      toast.success('মুছে ফেলা হয়েছে')
      load()
    } catch {
      toast.error('ত্রুটি হয়েছে')
    } finally {
      setDeleting(null)
    }
  }

  const parentCategories = categories.filter(c => !c.parentId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">ক্যাটাগরি</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">
          + নতুন ক্যাটাগরি
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">লোড হচ্ছে...</p>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">নাম</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">স্লাগ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">প্যারেন্ট</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">উপ-ক্যাটাগরি</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">কোনো ক্যাটাগরি নেই</td></tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id} className={`border-b hover:bg-gray-50 ${cat.parentId ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium">
                      {cat.parentId && <span className="text-gray-400 mr-2">↳</span>}
                      {cat.image && <span className="mr-1">🖼️</span>}
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {cat.parent ? <Badge variant="secondary">{cat.parent.name}</Badge> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">{cat._count?.products ?? 0}</td>
                    <td className="px-4 py-3">{cat.children?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(cat)} className="text-blue-600 hover:underline mr-3 text-xs">এডিট</button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleting === cat.id}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        মুছুন
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'ক্যাটাগরি এডিট' : 'নতুন ক্যাটাগরি'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ক্যাটাগরির নাম"
                />
                {form.name && (
                  <p className="text-xs text-gray-400 mt-1">স্লাগ: {generateSlug(form.name)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">প্যারেন্ট ক্যাটাগরি</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.parentId}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                >
                  <option value="">— কোনো প্যারেন্ট নেই —</option>
                  {parentCategories
                    .filter(c => c.id !== editing?.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ছবি URL</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-amber-900 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
