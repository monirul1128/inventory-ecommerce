'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Product {
  id: string
  name: string
  sku: string
  sellPrice: number
  stock: number
  unit: string
  warranty?: string | null
  images: string[]
}

interface CartItem {
  product: Product
  qty: number
  price: number
  total: number
}

interface Customer {
  id: string
  name: string
  phone: string
}

export default function POSPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paidAmount, setPaidAmount] = useState('')
  const [loading, setLoading] = useState(false)

  // Load products and customers
  useEffect(() => {
    Promise.all([
      fetch('/api/products?limit=100').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([prods, custs]) => {
      setProducts(prods)
      setFilteredProducts(prods)
      setCustomers(custs)
    })
  }, [])

  // Filter products by search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products)
      return
    }
    
    const query = search.toLowerCase()
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.barcode?.toLowerCase().includes(query)
    )
    setFilteredProducts(filtered)
  }, [search, products])

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      return toast.error('স্টক নেই')
    }

    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.qty >= product.stock) {
        return toast.error('পর্যাপ্ত স্টক নেই')
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price }
          : item
      ))
    } else {
      setCart([...cart, {
        product,
        qty: 1,
        price: product.sellPrice,
        total: product.sellPrice,
      }])
    }
    toast.success(`${product.name} যোগ করা হয়েছে`)
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        if (qty > item.product.stock) {
          toast.error('পর্যাপ্ত স্টক নেই')
          return item
        }
        return { ...item, qty, total: qty * item.price }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
    toast.success('মুছে ফেলা হয়েছে')
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
  const paid = parseFloat(paidAmount) || 0
  const due = total - paid
  const change = paid > total ? paid - total : 0

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error('কার্ট খালি')
    if (paid < total && paymentMethod !== 'CREDIT') {
      return toast.error('পর্যাপ্ত টাকা দিন')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer || null,
          items: cart.map(item => ({
            productId: item.product.id,
            qty: item.qty,
            sellPrice: item.price,
          })),
          subtotal,
          discount,
          total,
          paidAmount: paid,
          dueAmount: due > 0 ? due : 0,
          paymentMethod,
        }),
      })

      if (!res.ok) throw new Error('বিক্রয় যোগ করা যায়নি')

      const sale = await res.json()
      toast.success('বিক্রয় সম্পন্ন হয়েছে! ✅')
      
      // Reset
      setCart([])
      setSelectedCustomer('')
      setDiscount(0)
      setPaidAmount('')
      
      // Redirect to invoice
      router.push(`/admin/invoices/${sale.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-900">🛒 POS - বিক্রয় পয়েন্ট</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <input
                type="text"
                placeholder="পণ্যের নাম, SKU, বা বারকোড দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">কোনো পণ্য পাওয়া যায়নি</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="bg-white p-3 rounded-lg border hover:border-amber-500 hover:shadow transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <p className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-600">
                      {formatCurrency(product.sellPrice)}
                    </span>
                    <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'} className="text-xs">
                      {product.stock} {product.unit}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">কাস্টমার</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">— ওয়াক-ইন কাস্টমার —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex justify-between">
                <span>কার্ট</span>
                <Badge>{cart.length} টি</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">কার্ট খালি</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id} className="border rounded p-2">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-medium flex-1">{item.product.name}</p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.qty}
                          onChange={(e) => updateQty(item.product.id, parseInt(e.target.value))}
                          className="w-16 border rounded px-2 py-1 text-xs text-center"
                        />
                        <span className="text-xs text-gray-500">×</span>
                        <span className="text-xs">{formatCurrency(item.price)}</span>
                        <span className="text-xs font-bold text-green-600 ml-auto">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>সাবটোটাল</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>ডিসকাউন্ট</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 border rounded px-2 py-1 text-right text-sm"
                />
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>মোট</span>
                <span className="text-amber-700">{formatCurrency(total)}</span>
              </div>
              <div>
                <label className="text-xs text-gray-600">পেমেন্ট মেথড</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm mt-1"
                >
                  <option value="CASH">নগদ</option>
                  <option value="BKASH">বিকাশ</option>
                  <option value="NAGAD">নগদ</option>
                  <option value="CARD">কার্ড</option>
                  <option value="CREDIT">বাকি</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">পরিশোধিত টাকা</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm mt-1"
                  placeholder="0"
                />
              </div>
              {due > 0 && paymentMethod === 'CREDIT' && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>বাকি</span>
                  <span className="font-bold">{formatCurrency(due)}</span>
                </div>
              )}
              {change > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>ফেরত</span>
                  <span className="font-bold">{formatCurrency(change)}</span>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="w-full bg-amber-900 text-white py-3 rounded-lg font-bold hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'প্রসেস হচ্ছে...' : 'বিক্রয় সম্পন্ন করুন'}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
