'use client'
import Link from 'next/link'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore, selectTotalPrice, getDelivery } from '@/lib/cart-store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)

  const subtotal = useCartStore(selectTotalPrice)
  const delivery = getDelivery(subtotal)

  const handleRemove = (id: string) => {
    removeItem(id)
    toast.success('পণ্য সরানো হয়েছে')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={80} className="text-amber-200 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-amber-900 mb-3">আপনার কার্ট খালি</h2>
        <p className="text-gray-500 mb-8">এখনও কোনো পণ্য যোগ করেননি। আমাদের শপ থেকে পণ্য বেছে নিন।</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-amber-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-800 transition-colors"
        >
          কেনাকাটা শুরু করুন <ArrowRight size={18} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-amber-900 mb-8">🛒 আমার কার্ট</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-amber-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-amber-50 text-left text-sm text-amber-900 font-semibold">
                  <th className="px-4 py-3">পণ্য</th>
                  <th className="px-4 py-3 text-right">দাম</th>
                  <th className="px-4 py-3 text-center">পরিমাণ</th>
                  <th className="px-4 py-3 text-right">মোট</th>
                  <th className="px-4 py-3 text-center">মুছুন</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t border-amber-50 hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-amber-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">🪑</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">৳{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="w-7 h-7 rounded border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors text-amber-800"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="w-7 h-7 rounded border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors text-amber-800"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-amber-800">
                      ৳{(item.price * item.qty).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 text-sm font-medium transition-colors"
            >
              ← কেনাকাটা চালিয়ে যান
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-amber-900 text-lg mb-5">অর্ডার সারসংক্ষেপ</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>সাবটোটাল ({items.length} পণ্য)</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>ডেলিভারি চার্জ</span>
                <span className={delivery === 0 ? "text-green-600 font-medium" : ""}>
                  {delivery === 0 ? 'বিনামূল্যে' : `৳${delivery}`}
                </span>
              </div>
              <div className="border-t border-amber-100 pt-3 flex justify-between font-bold text-amber-900 text-base">
                <span>মোট</span>
                <span>৳{(subtotal + delivery).toLocaleString()}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 w-full bg-amber-700 text-white py-3 rounded-xl font-semibold hover:bg-amber-800 transition-colors flex items-center justify-center gap-2 text-base"
            >
              চেকআউট করুন <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
