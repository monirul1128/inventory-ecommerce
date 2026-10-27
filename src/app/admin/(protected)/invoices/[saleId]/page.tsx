'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SaleItem {
  id: string
  qty: number
  sellPrice: number
  total: number
  product: { name: string; sku: string; unit: string; warranty?: string | null }
}

interface Sale {
  id: string
  invoiceNo: string
  date: string
  subtotal: number
  discount: number
  vat: number
  total: number
  paidAmount: number
  dueAmount: number
  paymentMethod: string
  note: string | null
  customer?: { name: string; phone: string; address?: string | null } | null
  items: SaleItem[]
}

export default function InvoicePage() {
  const params = useParams()
  const saleId = params.saleId as string
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [shopInfo, setShopInfo] = useState({ name: 'ফার্নিচার শপ', address: '', phone: '', email: '' })

  useEffect(() => {
    fetch(`/api/sales/${saleId}`).then(r => r.json()).then(data => { setSale(data); setLoading(false) })
    const stored = localStorage.getItem('shopInfo')
    if (stored) setShopInfo(JSON.parse(stored))
  }, [saleId])

  const handlePrint = () => window.print()

  const handlePDF = async () => {
    if (!sale) return
    const { default: jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(shopInfo.name, 105, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.text(shopInfo.address, 105, 22, { align: 'center' })
    doc.text(shopInfo.phone, 105, 27, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Invoice: ${sale.invoiceNo}`, 14, 38)
    doc.text(`Date: ${formatDate(sale.date)}`, 14, 44)
    if (sale.customer) {
      doc.text(`Customer: ${sale.customer.name}`, 14, 50)
      doc.text(`Phone: ${sale.customer.phone}`, 14, 56)
    }
    autoTable(doc, {
      startY: 65,
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: sale.items.map(item => [
        item.product.name,
        `${item.qty} ${item.product.unit}`,
        formatCurrency(item.sellPrice),
        formatCurrency(item.total),
      ]),
    })
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.text(`Subtotal: ${formatCurrency(sale.subtotal)}`, 140, finalY)
    if (sale.discount > 0) doc.text(`Discount: -${formatCurrency(sale.discount)}`, 140, finalY + 6)
    if (sale.vat > 0) doc.text(`VAT: ${formatCurrency(sale.vat)}`, 140, finalY + 12)
    doc.setFontSize(13)
    doc.text(`Total: ${formatCurrency(sale.total)}`, 140, finalY + 20)
    doc.setFontSize(10)
    doc.text(`Paid: ${formatCurrency(sale.paidAmount)}`, 140, finalY + 26)
    if (sale.dueAmount > 0) doc.text(`Due: ${formatCurrency(sale.dueAmount)}`, 140, finalY + 32)
    doc.save(`${sale.invoiceNo}.pdf`)
  }

  const handleWhatsApp = () => {
    if (!sale) return
    const msg = encodeURIComponent(`আপনার চালান মোট ৳${sale.total.toLocaleString()}। চালান নং: ${sale.invoiceNo}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) return <div className="flex justify-center py-20 text-gray-400">লোড হচ্ছে...</div>
  if (!sale) return <div className="text-center py-20 text-red-500">চালান পাওয়া যায়নি।</div>

  return (
    <div>
      {/* Print Controls — hidden on print */}
      <div className="print:hidden flex gap-3 mb-6">
        <button onClick={handlePrint} className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 text-sm">🖨️ প্রিন্ট</button>
        <button onClick={handlePDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">📄 PDF ডাউনলোড</button>
        <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">💬 WhatsApp শেয়ার</button>
        <button onClick={() => window.history.back()} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">← ফিরে যান</button>
      </div>

      {/* Invoice */}
      <div id="invoice-content" className="bg-white p-8 max-w-2xl mx-auto rounded-xl ring-1 ring-gray-200 print:shadow-none print:ring-0">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-amber-900">{shopInfo.name}</h1>
          {shopInfo.address && <p className="text-sm text-gray-500">{shopInfo.address}</p>}
          {shopInfo.phone && <p className="text-sm text-gray-500">📞 {shopInfo.phone}</p>}
          {shopInfo.email && <p className="text-sm text-gray-500">✉️ {shopInfo.email}</p>}
        </div>

        {/* Invoice Info */}
        <div className="flex justify-between mb-4 text-sm">
          <div>
            <p className="font-semibold text-gray-700">চালান নং</p>
            <p className="font-mono text-lg">{sale.invoiceNo}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-700">তারিখ</p>
            <p>{formatDate(sale.date)}</p>
          </div>
        </div>

        {/* Customer */}
        {sale.customer && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
            <p className="font-semibold text-gray-700 mb-1">কাস্টমার তথ্য</p>
            <p className="font-medium">{sale.customer.name}</p>
            <p className="text-gray-500">📞 {sale.customer.phone}</p>
            {sale.customer.address && <p className="text-gray-500">📍 {sale.customer.address}</p>}
          </div>
        )}

        {/* Items */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">#</th>
              <th className="text-left py-2 font-semibold text-gray-700">পণ্য</th>
              <th className="text-right py-2 font-semibold text-gray-700">পরিমাণ</th>
              <th className="text-right py-2 font-semibold text-gray-700">একক মূল্য</th>
              <th className="text-right py-2 font-semibold text-gray-700">মোট</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="py-2 text-gray-400">{idx + 1}</td>
                <td className="py-2">
                  <div>{item.product.name}</div>
                  {item.product.warranty && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      🛡️ ওয়ারেন্টি: {item.product.warranty}
                    </div>
                  )}
                </td>
                <td className="py-2 text-right">{item.qty} {item.product.unit}</td>
                <td className="py-2 text-right">{formatCurrency(item.sellPrice)}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">সাবটোটাল</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>ডিসকাউন্ট</span>
              <span>− {formatCurrency(sale.discount)}</span>
            </div>
          )}
          {sale.vat > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">ভ্যাট</span>
              <span>{formatCurrency(sale.vat)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>মোট</span>
            <span className="text-amber-700">{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>পরিশোধ ({sale.paymentMethod})</span>
            <span>{formatCurrency(sale.paidAmount)}</span>
          </div>
          {sale.dueAmount > 0 && (
            <div className="flex justify-between text-red-600 font-medium">
              <span>বাকি</span>
              <span>{formatCurrency(sale.dueAmount)}</span>
            </div>
          )}
        </div>

        {sale.note && (
          <div className="mt-4 text-sm text-gray-500 border-t pt-3">
            <span className="font-medium">নোট:</span> {sale.note}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
          ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য!
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
