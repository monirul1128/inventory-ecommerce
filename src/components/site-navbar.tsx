'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Menu } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useCartStore, selectTotalItems } from '@/lib/cart-store'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const NAV_LINKS = [
  { href: '/', label: 'হোম' },
  { href: '/shop', label: 'শপ' },
  { href: '/orders', label: 'অর্ডার ট্র্যাক' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function SiteNavbar() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const totalItems = useCartStore(selectTotalItems)

  // Guard the cart badge so it never renders during SSR / first client render,
  // avoiding any SSR/CSR mismatch before the persisted cart rehydrates.
  useEffect(() => {
    setMounted(true)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    router.push(`/shop?search=${encodeURIComponent(search.trim())}`)
    setOpen(false)
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🪑</span>
            <span className="font-bold text-amber-900 text-xl">ফার্নিচার স্টোর</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors ${
                  isActive(pathname, l.href)
                    ? 'text-amber-700 font-medium'
                    : 'text-gray-700 hover:text-amber-700'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={submitSearch} className="hidden md:flex">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="border border-amber-200 rounded-l px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-700 text-white px-3 py-1.5 rounded-r text-sm hover:bg-amber-800 transition-colors"
              >
                <Search size={14} />
              </button>
            </form>

            <Link href="/cart" className="relative shrink-0" aria-label="কার্ট">
              <ShoppingCart className="text-amber-800" size={24} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              className="md:hidden text-gray-700"
              onClick={() => setOpen(true)}
              aria-label="মেনু খুলুন"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={(o) => setOpen(o)}>
        <SheetContent side="left" className="overflow-y-auto p-6">
          <SheetTitle className="font-bold text-amber-900 text-lg mb-4">
            ফার্নিচার স্টোর
          </SheetTitle>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2 px-2 rounded-lg transition-colors ${
                  isActive(pathname, l.href)
                    ? 'text-amber-700 font-medium bg-amber-50'
                    : 'text-gray-700 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={submitSearch} className="flex mt-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="border border-amber-200 rounded-l px-3 py-1.5 text-sm flex-1 focus:outline-none focus:border-amber-500"
            />
            <button type="submit" className="bg-amber-700 text-white px-3 py-1.5 rounded-r text-sm">
              <Search size={14} />
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
