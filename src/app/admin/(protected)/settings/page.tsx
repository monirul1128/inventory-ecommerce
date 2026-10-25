'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

interface ShopInfo {
  name: string
  address: string
  phone: string
  email: string
  website: string
  vatNo: string
}

const defaultShopInfo: ShopInfo = { name: 'ফার্নিচার শপ', address: '', phone: '', email: '', website: '', vatNo: '' }

export default function SettingsPage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo>(defaultShopInfo)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingShop, setSavingShop] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('shopInfo')
    if (stored) {
      try { setShopInfo(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  const saveShopInfo = async () => {
    setSavingShop(true)
    try {
      localStorage.setItem('shopInfo', JSON.stringify(shopInfo))
      toast.success('শপের তথ্য সংরক্ষিত হয়েছে')
    } finally {
      setSavingShop(false)
    }
  }

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) throw new Error('ব্যাকআপ ব্যর্থ')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('ব্যাকআপ ডাউনলোড হয়েছে')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ব্যাকআপ ত্রুটি')
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('এই ফাইল দিয়ে ডেটা রিস্টোর করবেন? বর্তমান ডেটা মুছে যাবে!')) {
      e.target.value = ''
      return
    }
    setRestoring(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/restore', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('ডেটা রিস্টোর হয়েছে')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'রিস্টোর ত্রুটি')
    } finally {
      setRestoring(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('নতুন পাসওয়ার্ড মেলেনি')
    if (passwordForm.newPassword.length < 6) return toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
    setSavingPwd(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-amber-900">সেটিংস ⚙️</h1>

      {/* Shop Info */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">শপের তথ্য</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'শপের নাম', placeholder: 'ফার্নিচার শপ' },
            { key: 'phone', label: 'ফোন', placeholder: '01XXXXXXXXX' },
            { key: 'email', label: 'ইমেইল', placeholder: 'shop@example.com' },
            { key: 'website', label: 'ওয়েবসাইট', placeholder: 'https://example.com' },
            { key: 'vatNo', label: 'ভ্যাট নম্বর', placeholder: 'VAT-XXXXXXXX' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={shopInfo[f.key as keyof ShopInfo]}
                onChange={e => setShopInfo(s => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder} />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ঠিকানা</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={2} value={shopInfo.address}
              onChange={e => setShopInfo(s => ({ ...s, address: e.target.value }))}
              placeholder="শপের পূর্ণ ঠিকানা" />
          </div>
        </div>
        <button onClick={saveShopInfo} disabled={savingShop}
          className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm disabled:opacity-50">
          {savingShop ? 'সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ করুন'}
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">ডেটা ব্যাকআপ ও রিস্টোর</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleBackup}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            📥 ব্যাকআপ ডাউনলোড করুন
          </button>
          <div>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
            <button onClick={() => fileRef.current?.click()} disabled={restoring}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm disabled:opacity-50">
              {restoring ? 'রিস্টোর হচ্ছে...' : '📤 ডেটা রিস্টোর করুন'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">⚠️ রিস্টোর করলে বর্তমান সব ডেটা মুছে যাবে!</p>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">পাসওয়ার্ড পরিবর্তন</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'বর্তমান পাসওয়ার্ড', placeholder: '••••••••' },
            { key: 'newPassword', label: 'নতুন পাসওয়ার্ড', placeholder: '••••••••' },
            { key: 'confirmPassword', label: 'নতুন পাসওয়ার্ড নিশ্চিত করুন', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={passwordForm[f.key as keyof typeof passwordForm]}
                onChange={e => setPasswordForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} required />
            </div>
          ))}
          <button type="submit" disabled={savingPwd}
            className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm disabled:opacity-50">
            {savingPwd ? 'পরিবর্তন হচ্ছে...' : '🔐 পাসওয়ার্ড পরিবর্তন করুন'}
          </button>
        </form>
      </div>
    </div>
  )
}
