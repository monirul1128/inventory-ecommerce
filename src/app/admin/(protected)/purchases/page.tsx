'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, generateInvoiceNo } from '@/lib/utils'

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; sku: string; buyPrice: number; unit: string }
interface CartItem { product: Product; qty: number; buyPrice: number }

export default function PurchasePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState({
    supplierId: '', invoiceNo: generateInvoiceNo('PUR'), date: new Date().toISOString().slice(0, 10), note: '',
  })
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addQty, setAddQty] = useState('1')
  const [addPrice, setAddPrice] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paidAmount, setPaidAmount] = useState('0')
  const [saving, setSaving] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers)
  }, [])

  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return }
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(async () => {
      const res = await fetch(`/api/products?search=${productSearch}`)
      setSearchResults(await res.json())
    }, 300)
  }, [productSearch])

  const selectProduct = (p: Product) => {
    setSelectedProduct(p)
    setAddPrice(String(p.buyPrice))
    setProductSearch(p.name)
    setSearchResults([])
  }

  const addToCart = () => {
    if (!selectedProduct) return toast.error('পণ্য বেছে নিন')
    const qty = parseFloat(addQty)
    const price = parseFloat(addPrice)
    if (qty <= 0 || price <= 0) return toast.error('পরিমাণ ও মূল্য সঠিক দিন')
    setCart(c => {
      const idx = c.findIndex(i => i.product.id === selectedProduct.id)
      if (idx >= 0) {
        const updated = [...c]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty, buyPrice: price }
        return updated
      }
      return [...c, { product: selectedProduct, qty, buyPrice: price }]
    })
    setSelectedProduct(null)
    setProductSearch('')
    setAddQty('1')
    setAddPrice('')
  }

  const removeFromCart = (id: string) => setCart(c => c.filter(i => i.product.id !== id))

  const total = cart.reduce((s, i) => s + i.qty * i.buyPrice, 0)
  const paid = parseFloat(paidAmount) || 0
  const due = total - paid

  const handleSubmit = async () => {
    if (!form.supplierId) return toast.error('সাপ্লায়ার বেছে নিন')
    if (cart.length === 0) return toast.error('অন্তত একটি পণ্য যোগ করুন')
    setSaving(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: form.supplierId,
          invoiceNo: form.invoiceNo,
          date: form.date,
          note: form.note,
          paidAmount: paid,
          items: cart.map(i => ({ productId: i.product.id, qty: i.qty, buyPrice: i.buyPrice })),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('ক্রয় সংরক্ষিত হয়েছে')
      setCart([])
      setPaidAmount('0')
      setForm({ supplierId: '', invoiceNo: generateInvoiceNo('PUR'), date: new Date().toISOString().slice(0, 10), note: '' })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ত্রুটি')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-amber-900">মাল ক্রয় এন্ট্রি</h1>

      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">সাপ্লায়ার *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
              <option value="">— বেছে নিন —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">চালান নং</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নোট</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="ঐচ্ছিক নোট" />
          </div>
        </div>
      </div>

      {/* Add Item */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">পণ্য যোগ করুন</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="পণ্যের নাম বা SKU দিয়ে খুঁজুন..." />
            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {searchResults.map(p => (
                  <li key={p.id} className="px-3 py-2 hover:bg-amber-50 cursor-pointer text-sm border-b last:border-0"
                    onClick={() => selectProduct(p)}>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400 text-xs ml-2">{p.sku}</span>
                    <span className="text-green-600 text-xs ml-2">{formatCurrency(p.buyPrice)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input type="number" min="0.001" step="0.001" placeholder="পরিমাণ"
            className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={addQty} onChange={e => setAddQty(e.target.value)} />
          <input type="number" min="0" step="0.01" placeholder="ক্রয় মূল্য"
            className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={addPrice} onChange={e => setAddPrice(e.target.value)} />
          <button onClick={addToCart} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">যোগ করুন</button>
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">পণ্য</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">পরিমাণ</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">মূল্য</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">মোট</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.product.id} className="border-b">
                  <td className="px-4 py-3">{item.product.name} <span className="text-gray-400 text-xs">({item.product.sku})</span></td>
                  <td className="px-4 py-3 text-right">{item.qty} {item.product.unit}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.buyPrice)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.qty * item.buyPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-700 text-lg">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="p-4 bg-gray-50 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">মোট পরিমাণ</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">পরিশোধ</label>
              <input type="number" min="0" step="0.01" className="w-40 border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className={due > 0 ? 'text-red-600' : 'text-green-600'}>বাকি</span>
              <span className={due > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(due)}</span>
            </div>
            <button onClick={handleSubmit} disabled={saving}
              className="w-full py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 font-medium disabled:opacity-50 mt-2">
              {saving ? 'সংরক্ষণ হচ্ছে...' : '✅ ক্রয় সম্পন্ন করুন'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
