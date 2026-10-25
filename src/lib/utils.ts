export { cn } from "cn"

export function generateSKU(prefix = 'PRD') { return `${prefix}-${Date.now()}` }
export function generateBarcode() { return '880' + Math.floor(Math.random() * 9999999999).toString().padStart(10, '0') }
export function formatCurrency(amount: number) { return `৳${amount.toLocaleString('en-BD')}` }
export function formatDate(date: string | Date) { return new Date(date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) }
export function generateSlug(name: string) { return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') }
export function generateInvoiceNo(prefix = 'INV') {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${prefix}-${date}-${rand}`
}
export function generateOrderNo() {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `ORD-${date}-${rand}`
}
