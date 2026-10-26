'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Package, ChevronRight, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  qty: number
  price: number
  total: number
  product: { name: string }
}

interface Order {
  id: string
  orderNo: string
  status: string
  total: number
  paymentMethod: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'অপেক্ষমান', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PROCESSING: { label: 'প্রক্রিয়াধীন', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  SHIPPED:    { label: 'শিপমেন্ট', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  DELIVERED:  { label: 'ডেলিভারি', color: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED:  { label: 'বাতিল', color: 'bg-red-100 text-red-800 border-red-200' },
}

export default function OrdersPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'অর্ডার খুঁজতে সমস্যা হয়েছে')
        setOrders([])
      } else {
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch {
      setError('সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <Package size={56} className="text-amber-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-amber-900">অর্ডার ট্র্যাক করুন</h1>
        <p className="text-gray-500 mt-2 text-sm">আপনার ফোন নম্বর দিয়ে অর্ডারের অবস্থান জানুন</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          maxLength={11}
          className="flex-1 border border-amber-200 rounded-l-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-base"
        />
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="bg-amber-700 text-white px-6 py-3 rounded-r-xl font-medium hover:bg-amber-800 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          খুঁজুন
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {searched && !loading && !error && orders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 text-amber-200" />
          <p>এই নম্বরে কোনো অর্ডার পাওয়া যায়নি</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{orders.length} টি অর্ডার পাওয়া গেছে</p>
          {orders.map(order => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl border border-amber-100 shadow-sm p-4 hover:shadow-md hover:border-amber-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-amber-900 group-hover:text-amber-700 transition-colors">
                      {order.orderNo}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-amber-700 transition-colors" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{order.items.length} টি পণ্য</span>
                  <span className="font-bold text-amber-800">৳{order.total.toLocaleString()}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
