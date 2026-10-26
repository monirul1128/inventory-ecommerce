'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore, selectTotalPrice, getDelivery } from '@/lib/cart-store'

const PAYMENT_METHODS = [
  { value: 'COD', label: '💵 ক্যাশ অন ডেলিভারি' },
  { value: 'BKASH', label: '📱 বিকাশ' },
  { value: 'NAGAD', label: '📱 নগদ' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore(selectTotalPrice)
  const delivery = getDelivery(subtotal)

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'COD',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (items.length === 0 && !success) {
      router.replace('/cart')
    }
  }, [items, success, router])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.customerName.trim()) errs.customerName = 'নাম প্রয়োজন'
    if (!form.phone.trim()) errs.phone = 'ফোন নম্বর প্রয়োজন'
    else if (!/^\d{11}$/.test(form.phone.trim())) errs.phone = 'ফোন নম্বর ১১ ডিজিটের হতে হবে'
    if (!form.address.trim()) errs.address = 'ঠিকানা প্রয়োজন'
    return errs
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => { const n = { ...er }; delete n[name]; return n })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const orderItems = items.map(i => ({
        productId: i.id,
        qty: i.qty,
        price: i.price,
      }))

      const total = subtotal + delivery

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          note: form.note.trim() || null,
          paymentMethod: form.paymentMethod,
          items: orderItems,
          subtotal,
          discount: 0,
          total,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'অর্ডার দিতে সমস্যা হয়েছে')
        return
      }

      // Clear cart
      clearCart()
      setSuccess(true)
      toast.success('অর্ডার সফলভাবে দেওয়া হয়েছে!')

      setTimeout(() => {
        router.push(`/orders/${data.id}`)
      }, 1500)
    } catch {
      toast.error('অর্ডার দিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <CheckCircle size={72} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-amber-900 mb-2">অর্ডার সফল!</h2>
        <p className="text-gray-500">অর্ডার ডিটেইলসে যাচ্ছি…</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-amber-900 mb-8">চেকআউট</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6">
              <h2 className="font-bold text-amber-900 mb-5 text-lg">ডেলিভারি তথ্য</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="আপনার পুরো নাম"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      errors.customerName ? 'border-red-400' : 'border-amber-200'
                    }`}
                  />
                  {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ফোন নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      errors.phone ? 'border-red-400' : 'border-amber-200'
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="বাড়ি নং, রোড, এলাকা, জেলা"
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none ${
                      errors.address ? 'border-red-400' : 'border-amber-200'
                    }`}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    বিশেষ নোট <span className="text-gray-400 font-normal">(ঐচ্ছিক)</span>
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন"
                    rows={2}
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6">
              <h2 className="font-bold text-amber-900 mb-5 text-lg">পেমেন্ট পদ্ধতি</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={form.paymentMethod === m.value}
                      onChange={handleChange}
                      className="w-4 h-4 accent-amber-700"
                    />
                    <span className={`text-sm font-medium transition-colors ${
                      form.paymentMethod === m.value ? 'text-amber-800' : 'text-gray-700 group-hover:text-amber-700'
                    }`}>
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6 sticky top-24">
              <h2 className="font-bold text-amber-900 text-lg mb-5">অর্ডার সারসংক্ষেপ</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🪑</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">× {item.qty}</p>
                    </div>
                    <span className="text-sm font-medium text-amber-800 shrink-0">
                      ৳{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-amber-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি</span>
                  <span className={delivery === 0 ? "text-green-600" : ""}>
                    {delivery === 0 ? 'বিনামূল্যে' : `৳${delivery}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-amber-900 text-base pt-2 border-t border-amber-100">
                  <span>মোট</span>
                  <span>৳{(subtotal + delivery).toLocaleString()}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="mt-6 w-full bg-amber-700 text-white py-3 rounded-xl font-semibold hover:bg-amber-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> অর্ডার দেওয়া হচ্ছে…</>
                ) : (
                  'অর্ডার দিন'
                )}
              </button>
              <Link href="/cart" className="mt-3 block text-center text-sm text-amber-700 hover:underline">
                ← কার্টে ফিরুন
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
