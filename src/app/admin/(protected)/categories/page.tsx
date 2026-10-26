'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { generateSlug } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/image-upload'

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
  const [form, setForm] = useState({ name: '', parentId: '', images: [] as string[] })
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
    setForm({ name: '', parentId: '', images: [] })
    setShowDialog(true)
  }

  const openEdit = (cat: Category) => {
    console.log('Opening edit for category:', cat)
    console.log('Category image:', cat.image)
    setEditing(cat)
    const imageArray = cat.image ? [cat.image] : []
    console.log('Setting images array:', imageArray)
    setForm({ name: cat.name, parentId: cat.parentId || '', images: imageArray })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('নাম প্রয়োজন')
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        parentId: form.parentId || null,
        image: form.images[0] || null,
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
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-12 text-center">
          <p className="text-gray-400">কোনো ক্যাটাগরি নেই</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
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
                {categories.map(cat => (
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
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(cat)} className="text-blue-600 hover:underline text-xs">এডিট</button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleting === cat.id}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        মুছুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className={`bg-white rounded-lg ring-1 ring-gray-200 p-4 ${cat.parentId ? 'ml-4 bg-amber-50/30' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {cat.parentId && <span className="text-gray-400 mr-1">↳</span>}
                      {cat.image && <span className="mr-1">🖼️</span>}
                      {cat.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{cat.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(cat)} className="text-blue-600 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleting === cat.id}
                      className="text-red-600 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  {cat.parent && (
                    <div>
                      <span className="text-gray-400">প্যারেন্ট:</span> <Badge variant="secondary" className="text-xs">{cat.parent.name}</Badge>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">পণ্য:</span> <span className="font-medium">{cat._count?.products ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">উপ:</span> <span className="font-medium">{cat.children?.length ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">ক্যাটাগরি ছবি</label>
                <ImageUpload
                  images={form.images}
                  onChange={(images) => setForm(f => ({ ...f, images }))}
                  maxImages={1}
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
