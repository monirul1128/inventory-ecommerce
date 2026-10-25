'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  sellPrice: number
  buyPrice: number
  stock: number
  unit: string
  images: string[]
}

interface CartItem {
  product: Product
  qty: number
  sellPrice: number
}

interface Customer { id: string; name: string; phone: string }

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'নগদ' },
  { value: 'BKASH', label: 'বিকাশ' },
  { value: 'NAGAD', label: 'নগদ (অ্যাপ)' },
  { value: 'CARD', label: 'কার্ড' },
  { value: 'CREDIT', label: 'বাকি' },
]

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [discount, setDiscount] = useState('0')
  const [vat, setVat] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [saving, setSaving] = useState(false)
  const [completedSale, setCompletedSale] = useState<{ id: string; invoiceNo: string } | null>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
    barcodeRef.current?.focus()
  }, [])

  const addProductToCart = useCallback((product: Product, quantity = 1) => {
    if (product.stock <= 0) return toast.error(`${product.name} — স্টক নেই!`)
    setCart(c => {
      const idx = c.findIndex(i => i.product.id === product.id)
      if (idx >= 0) {
        const updated = [...c]
        const newQty = updated[idx].qty + quantity
        if (newQty > product.stock) return toast.error('পর্যাপ্ত স্টক নেই'), c
        updated[idx] = { ...updated[idx], qty: newQty }
        return updated
      }
      return [...c, { product, qty: quantity, sellPrice: product.sellPrice }]
    })
  }, [])

  const handleBarcodeEnter = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !barcodeInput.trim()) return
    try {
      const res = await fetch(`/api/products?search=${barcodeInput.trim()}`)
      const products: Product[] = await res.json()
      const found = products.find(p => p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim())
      if (found) {
        addProductToCart(found)
        setBarcodeInput('')
      } else {
        toast.error('পণ্য পাওয়া যায়নি')
      }
    } catch {
      toast.error('ত্রুটি হয়েছে')
    }
  }

  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${productSearch}`)
      setSearchResults(await res.json())
    }, 300)
  }, [productSearch])

  const updateQty = (id: string, delta: number) => {
    setCart(c => c.map(item => {
      if (item.product.id !== id) return item
      const newQty = item.qty + delta
      if (newQty <= 0) return item
      if (newQty > item.product.stock) { toast.error('পর্যাপ্ত স্টক নেই'); return item }
      return { ...item, qty: newQty }
    }))
  }

  const removeFromCart = (id: string) => setCart(c => c.filter(i => i.product.id !== id))

  const subtotal = cart.reduce((s, i) => s + i.qty * i.sellPrice, 0)
  const discountAmt = parseFloat(discount) || 0
  const vatAmt = ((subtotal - discountAmt) * (parseFloat(vat) || 0)) / 100
  const total = subtotal - discountAmt + vatAmt
  const paid = parseFloat(paidAmount) || 0
  const change = paid - total

  const openPayment = () => {
    if (cart.length === 0) return toast.error('কার্টে কোনো পণ্য নেই')
    setPaidAmount(String(Math.ceil(total)))
    setShowPaymentModal(true)
  }

  const handleCheckout = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          items: cart.map(i => ({ productId: i.product.id, qty: i.qty, sellPrice: i.sellPrice })),
          subtotal,
          discount: discountAmt,
          vat: vatAmt,
          total,
          paidAmount: paid,
          paymentMethod,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const sale = await res.json()
      toast.success(`বিক্রয় সম্পন্ন! চালান: ${sale.invoiceNo}`)
      setCompletedSale({ id: sale.id, invoiceNo: sale.invoiceNo })
      setShowPaymentModal(false)
      setCart([])
      setCustomerId('')
      setDiscount('0')
      setVat('0')
      setPaidAmount('0')
      barcodeRef.current?.focus()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Left — Cart (65%) */}
      <div className="flex-[65] flex flex-col gap-3 min-w-0">
        {/* Barcode input */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-3">
          <input
            ref={barcodeRef}
            className="w-full border-2 border-amber-500 rounded-lg px-4 py-3 text-lg font-mono focus:outline-none focus:border-amber-700"
            placeholder="🔍 বারকোড স্ক্যান করুন বা টাইপ করুন → Enter"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeEnter}
            autoFocus
          />
        </div>

        {/* Cart Table */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-600">পণ্য</th>
                  <th className="text-right px-3 py-2 text-gray-600">একক দাম</th>
                  <th className="text-center px-3 py-2 text-gray-600">পরিমাণ</th>
                  <th className="text-right px-3 py-2 text-gray-600">মোট</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-300 text-4xl">🛒</td></tr>
                ) : cart.map(item => (
                  <tr key={item.product.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-400">{item.product.sku}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-24 border rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={item.sellPrice}
                        onChange={e => setCart(c => c.map(i => i.product.id === item.product.id ? { ...i, sellPrice: parseFloat(e.target.value) || 0 } : i))}
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold">−</button>
                        <span className="w-8 text-center font-medium">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-800 font-bold">+</button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(item.qty * item.sellPrice)}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 text-xl">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cart Summary */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">সাবটোটাল</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">ডিসকাউন্ট</span>
              <span className="text-orange-600">− {formatCurrency(discountAmt)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">ভ্যাট ({vat}%)</span>
              <span>{formatCurrency(vatAmt)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>মোট</span>
              <span className="text-amber-700">{formatCurrency(total)}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <select className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">— কাস্টমার (ঐচ্ছিক) —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <button onClick={openPayment} className="w-full mt-3 py-3 bg-amber-900 text-white rounded-xl hover:bg-amber-800 font-bold text-base">
              💳 চেকআউট
            </button>
          </div>
        </div>
      </div>

      {/* Right — Product Search (35%) */}
      <div className="flex-[35] bg-white rounded-xl ring-1 ring-gray-200 flex flex-col min-w-0">
        <div className="p-3 border-b">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="পণ্য খুঁজুন..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 && productSearch && (
            <p className="text-center text-gray-400 py-8 text-sm">কোনো পণ্য পাওয়া যায়নি</p>
          )}
          {searchResults.length === 0 && !productSearch && (
            <p className="text-center text-gray-300 py-12 text-4xl">📦</p>
          )}
          <div className="grid grid-cols-2 gap-2 p-3">
            {searchResults.map(p => (
              <button
                key={p.id}
                onClick={() => { addProductToCart(p); setProductSearch(''); setSearchResults([]) }}
                className="text-left p-2 border rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-20 object-cover rounded mb-1" />
                ) : (
                  <div className="w-full h-20 bg-gray-100 rounded mb-1 flex items-center justify-center text-2xl">📦</div>
                )}
                <div className="text-xs font-medium text-gray-800 truncate">{p.name}</div>
                <div className="text-xs text-green-600 font-bold">{formatCurrency(p.sellPrice)}</div>
                <div className={`text-xs ${p.stock <= 0 ? 'text-red-500' : 'text-gray-400'}`}>স্টক: {p.stock}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-amber-900">পেমেন্ট</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">পেমেন্ট পদ্ধতি</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${paymentMethod === m.value ? 'bg-amber-900 text-white border-amber-900' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ডিসকাউন্ট (৳)</label>
                  <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={discount} onChange={e => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ভ্যাট (%)</label>
                  <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={vat} onChange={e => setVat(e.target.value)} />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">সাবটোটাল</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">ডিসকাউন্ট</span><span className="text-orange-600">− {formatCurrency(discountAmt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">ভ্যাট</span><span>{formatCurrency(vatAmt)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>মোট</span><span className="text-amber-700">{formatCurrency(total)}</span></div>
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিশোধিত পরিমাণ (৳)</label>
                <input type="number" min="0" step="0.01" className="w-full border-2 border-amber-500 rounded-lg px-3 py-3 text-lg font-bold text-right focus:outline-none focus:border-amber-700"
                  value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              </div>

              {/* Change */}
              <div className={`p-3 rounded-lg text-center font-bold text-lg ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {change >= 0 ? `ফেরত: ${formatCurrency(change)}` : `বাকি: ${formatCurrency(Math.abs(change))}`}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 border rounded-xl hover:bg-gray-50 font-medium">বাতিল</button>
              <button onClick={handleCheckout} disabled={saving}
                className="flex-2 flex-[2] py-3 bg-amber-900 text-white rounded-xl hover:bg-amber-800 font-bold disabled:opacity-50">
                {saving ? 'প্রক্রিয়া হচ্ছে...' : '✅ বিক্রয় সম্পন্ন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl text-center p-8 space-y-4">
            <div className="text-6xl">✅</div>
            <h2 className="text-xl font-bold text-green-700">বিক্রয় সম্পন্ন!</h2>
            <p className="text-gray-600 font-mono text-sm">{completedSale.invoiceNo}</p>
            <div className="flex gap-3">
              <Link
                href={`/admin/invoices/${completedSale.id}`}
                target="_blank"
                className="flex-1 py-3 bg-amber-900 text-white rounded-xl hover:bg-amber-800 font-medium text-sm"
              >
                🖨️ প্রিন্ট ইনভয়েস
              </Link>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 border rounded-xl hover:bg-gray-50 font-medium text-sm"
              >
                নতুন বিক্রয়
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
