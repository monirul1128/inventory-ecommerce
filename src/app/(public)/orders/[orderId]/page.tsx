'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { Printer, Package, CheckCircle, Clock, Truck, Home, XCircle } from 'lucide-react'

interface OrderItem {
  id: string
  qty: number
  price: number
  total: number
  product: { name: string; images: string[] | null }
}

interface Order {
  id: string
  orderNo: string
  customerName: string
  phone: string
  address: string
  note: string | null
  status: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING:    { label: 'অপেক্ষমান', icon: <Clock size={20} />, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  PROCESSING: { label: 'প্রক্রিয়াধীন', icon: <Package size={20} />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  SHIPPED:    { label: 'শিপমেন্ট', icon: <Truck size={20} />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  DELIVERED:  { label: 'ডেলিভারি সম্পন্ন', icon: <CheckCircle size={20} />, color: 'text-green-600 bg-green-50 border-green-200' },
  CANCELLED:  { label: 'বাতিল', icon: <XCircle size={20} />, color: 'text-red-600 bg-red-50 border-red-200' },
}

const PAYMENT_LABELS: Record<string, string> = {
  COD: '💵 ক্যাশ অন ডেলিভারি',
  BKASH: '📱 বিকাশ',
  NAGAD: '📱 নগদ',
}

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true)
        else setOrder(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [orderId])

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-amber-50 rounded-xl h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-24">
        <p className="text-6xl mb-4">😢</p>
        <p className="text-gray-500 text-lg mb-4">অর্ডার পাওয়া যায়নি</p>
        <Link href="/orders" className="text-amber-700 hover:underline">অর্ডার তালিকায় ফিরুন</Link>
      </div>
    )
  }

  const statusInfo = STATUS_INFO[order.status] || { label: order.status, icon: <Package size={20} />, color: 'text-gray-600 bg-gray-50 border-gray-200' }
  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 print:px-2 print:py-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:mb-3">
        <div>
          <Link href="/orders" className="text-amber-700 hover:underline text-sm print:hidden">← অর্ডার তালিকা</Link>
          <h1 className="text-xl font-bold text-amber-900 mt-1">অর্ডার: {order.orderNo}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('bn-BD', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm hover:bg-amber-50 transition-colors print:hidden"
        >
          <Printer size={16} /> প্রিন্ট
        </button>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 font-medium text-sm mb-6 ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-xl border border-amber-100 p-5 mb-5 print:mb-3">
          <h2 className="font-semibold text-amber-900 mb-4 text-sm">অর্ডারের অবস্থান</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-amber-100 z-0" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-amber-600 z-0 transition-all"
              style={{ width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
            />
            {STATUS_STEPS.map((step, idx) => {
              const info = STATUS_INFO[step]
              const done = currentStep >= idx
              return (
                <div key={step} className="flex flex-col items-center gap-1 z-10 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-amber-700 border-amber-700 text-white'
                      : 'bg-white border-amber-200 text-gray-400'
                  }`}>
                    {idx === 0 && <Clock size={14} />}
                    {idx === 1 && <Package size={14} />}
                    {idx === 2 && <Truck size={14} />}
                    {idx === 3 && <Home size={14} />}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${done ? 'text-amber-800' : 'text-gray-400'}`}>
                    {info?.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-amber-100 p-5 mb-5 print:mb-3">
        <h2 className="font-semibold text-amber-900 mb-4">আইটেম তালিকা</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🪑</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                <p className="text-xs text-gray-500">× {item.qty} × ৳{item.price.toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold text-amber-800 shrink-0">৳{item.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-amber-100 mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>সাবটোটাল</span>
            <span>৳{order.subtotal.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>ডিসকাউন্ট</span>
              <span>- ৳{order.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-amber-900 text-base pt-1 border-t border-amber-100">
            <span>মোট</span>
            <span>৳{order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5 print:mb-3">
        <div className="bg-white rounded-xl border border-amber-100 p-5">
          <h2 className="font-semibold text-amber-900 mb-3 text-sm">ডেলিভারি তথ্য</h2>
          <div className="text-sm space-y-1 text-gray-700">
            <p className="font-medium">{order.customerName}</p>
            <p>📞 {order.phone}</p>
            <p>📍 {order.address}</p>
            {order.note && <p className="text-gray-500 italic">নোট: {order.note}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-5">
          <h2 className="font-semibold text-amber-900 mb-3 text-sm">পেমেন্ট তথ্য</h2>
          <p className="text-sm text-gray-700">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
          <p className="text-xs text-gray-400 mt-1">অর্ডার নং: {order.orderNo}</p>
        </div>
      </div>
    </div>
  )
}
