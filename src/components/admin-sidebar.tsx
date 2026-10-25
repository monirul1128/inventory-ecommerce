'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navSections = [
  {
    title: 'প্রধান',
    items: [
      { href: '/admin/dashboard', label: 'ড্যাশবোর্ড', icon: '📊' },
    ]
  },
  {
    title: 'পণ্য ব্যবস্থাপনা',
    items: [
      { href: '/admin/categories', label: 'ক্যাটাগরি', icon: '🏷️' },
      { href: '/admin/products', label: 'পণ্য তালিকা', icon: '📦' },
      { href: '/admin/products/add', label: 'পণ্য যোগ', icon: '➕' },
    ]
  },
  {
    title: 'ক্রয়',
    items: [
      { href: '/admin/purchases', label: 'মাল ক্রয়', icon: '🛒' },
      { href: '/admin/purchases/history', label: 'ক্রয় ইতিহাস', icon: '📋' },
      { href: '/admin/purchases/returns', label: 'ক্রয় ফেরত', icon: '↩️' },
    ]
  },
  {
    title: 'বিক্রয় / POS',
    items: [
      { href: '/admin/pos', label: 'POS স্ক্রিন', icon: '🖥️' },
      { href: '/admin/sales/history', label: 'বিক্রয় ইতিহাস', icon: '📈' },
      { href: '/admin/sales/returns', label: 'বিক্রয় ফেরত', icon: '↩️' },
    ]
  },
  {
    title: 'অনলাইন অর্ডার',
    items: [
      { href: '/admin/orders', label: 'অর্ডার ম্যানেজ', icon: '🛍️' },
    ]
  },
  {
    title: 'স্টক',
    items: [
      { href: '/admin/stock', label: 'বর্তমান স্টক', icon: '📦' },
      { href: '/admin/stock/movements', label: 'স্টক মুভমেন্ট', icon: '🔄' },
      { href: '/admin/stock/low-alerts', label: 'কম স্টক', icon: '⚠️' },
      { href: '/admin/stock/expiry-alerts', label: 'মেয়াদ সতর্কতা', icon: '⏰' },
      { href: '/admin/stock/damaged', label: 'নষ্ট মাল', icon: '🗑️' },
    ]
  },
  {
    title: 'হিসাব / লেজার',
    items: [
      { href: '/admin/ledger/customers', label: 'কাস্টমার বাকি', icon: '👤' },
      { href: '/admin/ledger/suppliers', label: 'সাপ্লায়ার বাকি', icon: '🏭' },
      { href: '/admin/ledger/payments', label: 'পেমেন্ট', icon: '💳' },
    ]
  },
  {
    title: 'সাপ্লায়ার ও কাস্টমার',
    items: [
      { href: '/admin/suppliers', label: 'সাপ্লায়ার', icon: '🏭' },
      { href: '/admin/customers', label: 'কাস্টমার', icon: '👥' },
    ]
  },
  {
    title: 'ক্যাশ ও খরচ',
    items: [
      { href: '/admin/cash', label: 'ক্যাশ রেজিস্টার', icon: '💰' },
      { href: '/admin/expenses', label: 'খরচ', icon: '💸' },
    ]
  },
  {
    title: 'কর্মচারী',
    items: [
      { href: '/admin/employees', label: 'কর্মচারী', icon: '👷' },
    ]
  },
  {
    title: 'রিপোর্ট',
    items: [
      { href: '/admin/reports/daily', label: 'দৈনিক রিপোর্ট', icon: '📅' },
      { href: '/admin/reports/monthly', label: 'মাসিক রিপোর্ট', icon: '📆' },
      { href: '/admin/reports/yearly', label: 'বার্ষিক রিপোর্ট', icon: '📊' },
      { href: '/admin/reports/top-products', label: 'শীর্ষ পণ্য', icon: '🏆' },
    ]
  },
  {
    title: 'সেটিংস',
    items: [
      { href: '/admin/settings', label: 'সেটিংস', icon: '⚙️' },
    ]
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn('h-full bg-amber-900 text-white flex flex-col transition-all duration-300', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex items-center justify-between p-4 border-b border-amber-800">
        {!collapsed && <span className="font-bold text-lg">🪑 ফার্নিচার শপ</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-amber-200 hover:text-white p-1">
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navSections.map(section => (
          <div key={section.title} className="mb-2">
            {!collapsed && <p className="px-4 py-1 text-xs text-amber-400 uppercase tracking-wider">{section.title}</p>}
            {section.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 text-sm hover:bg-amber-800 transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/') ? 'bg-amber-800 text-white font-medium' : 'text-amber-100'
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-amber-800">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-2 text-amber-200 hover:text-white text-sm w-full"
        >
          <span>🚪</span>
          {!collapsed && <span>লগআউট</span>}
        </button>
      </div>
    </aside>
  )
}
