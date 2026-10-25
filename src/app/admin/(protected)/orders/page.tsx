'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderItem {
  id: string
  qty: number
  price: number
  total: number
  product: { name: string; unit: string }
}

interface Order {
  id: string
  orderNo: string
  customerName: string
  phone: string
  address: string
  total: number
  subtotal: number
  discount: number
  paymentMethod: string
  status: string
  note: string | null
  createdAt: string
  items: OrderItem[]
}

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'পেন্ডিং',
  PROCESSING: 'প্রক্রিয়াধীন',
  SHIPPED: 'পাঠানো হয়েছে',
  DELIVERED: 'ডেলিভারি হয়েছে',
  CANCELLED: 'বাতিল',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    const res = await fetch(`/api/orders${params}`)
    setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const handleStatusUpdate = async (id: string, status: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('স্ট্যাটাস আপডেট হয়েছে')
      if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">অনলাইন অর্ডার ব্যবস্থাপনা 🛍️</h1>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'সব' }, ...STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_LABELS[s] }))].map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${statusFilter === opt.value ? 'bg-amber-900 text-white border-amber-900' : 'border-gray-200 hover:bg-gray-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">লোড হচ্ছে...</p> : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">অর্ডার নং</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">কাস্টমার</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">ফোন</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">মোট</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পেমেন্ট</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">স্ট্যাটাস</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">তারিখ</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">কোনো অর্ডার নেই</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(order)}>
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNo}</td>
                  <td className="px-4 py-3 font-medium">{order.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{order.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-blue-600 hover:underline text-xs" onClick={e => { e.stopPropagation(); setSelected(order) }}>দেখুন</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Dialog */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">অর্ডার বিস্তারিত</h2>
                <p className="text-sm text-gray-500 font-mono">{selected.orderNo}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">কাস্টমার:</span> <strong>{selected.customerName}</strong></div>
                <div><span className="text-gray-500">ফোন:</span> {selected.phone}</div>
                <div className="col-span-2"><span className="text-gray-500">ঠিকানা:</span> {selected.address}</div>
                <div><span className="text-gray-500">পেমেন্ট:</span> {selected.paymentMethod}</div>
                <div><span className="text-gray-500">তারিখ:</span> {formatDate(selected.createdAt)}</div>
              </div>

              <table className="w-full text-sm border rounded overflow-hidden">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2">পণ্য</th>
                    <th className="text-right px-3 py-2">পরিমাণ</th>
                    <th className="text-right px-3 py-2">মূল্য</th>
                    <th className="text-right px-3 py-2">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-2">{item.product.name}</td>
                      <td className="px-3 py-2 text-right">{item.qty}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm text-right">
                {selected.discount > 0 && <div className="text-orange-600">ডিসকাউন্ট: − {formatCurrency(selected.discount)}</div>}
                <div className="font-bold text-base">মোট: {formatCurrency(selected.total)}</div>
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">স্ট্যাটাস আপডেট</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => { setUpdatingStatus(s); handleStatusUpdate(selected.id, s) }}
                      disabled={saving && updatingStatus === s}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selected.status === s ? STATUS_COLORS[s] + ' border-transparent' : 'border-gray-200 hover:bg-gray-50'} disabled:opacity-50`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
