'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProductCard, type ProductCardProduct } from '@/components/product-card'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface Category {
  id: string
  name: string
  slug: string
}

interface ApiProduct {
  id: string
  name: string
  sellPrice: number
  stock: number
  images: unknown
  category?: { name: string; slug: string } | null
}

interface ProductGridProps {
  categorySlug?: string
  fixedCategory?: boolean
  initialSearch?: string
  initialCategorySlug?: string
  initialFeatured?: boolean
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'নতুন' },
  { value: 'price-asc', label: 'দাম: কম → বেশি' },
  { value: 'price-desc', label: 'দাম: বেশি → কম' },
] as const

const MAX_PRICE = 100000

export function ProductGrid({
  categorySlug,
  fixedCategory = false,
  initialSearch = '',
  initialCategorySlug = '',
  initialFeatured = false,
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductCardProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>('newest')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)
  const [search, setSearch] = useState(initialSearch)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Fetch categories once for the sidebar filter
  useEffect(() => {
    fetch('/api/categories/public')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Keep the search field in sync when the page passes a new initial search
  // (e.g. the navbar search box navigates to /shop?search=...)
  useEffect(() => {
    setSearch(initialSearch)
    setPage(1)
  }, [initialSearch])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '12')
      params.set('sort', sort)
      if (search) params.set('search', search)
      if (initialFeatured) params.set('featured', 'true')
      const slug = fixedCategory
        ? categorySlug ?? ''
        : selectedCategories[0] || initialCategorySlug || ''
      if (slug) params.set('categorySlug', slug)

      const res = await fetch(`/api/products/public?${params}`)
      const data = await res.json()
      let prods: ApiProduct[] = data.products || []

      // The public API has no price filter, so filter price client-side
      if (minPrice > 0 || maxPrice < MAX_PRICE) {
        prods = prods.filter((p) => p.sellPrice >= minPrice && p.sellPrice <= maxPrice)
      }

      const mapped: ProductCardProduct[] = prods.map((p) => ({
        id: p.id,
        name: p.name,
        sellPrice: p.sellPrice,
        stock: p.stock,
        images: Array.isArray(p.images) ? (p.images as string[]) : [],
        category: p.category ? { name: p.category.name, slug: p.category.slug } : undefined,
      }))

      setProducts(mapped)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('পণ্য লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [
    page,
    sort,
    search,
    initialFeatured,
    fixedCategory,
    categorySlug,
    selectedCategories,
    initialCategorySlug,
    minPrice,
    maxPrice,
  ])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
    setPage(1)
  }

  const resetFilters = () => {
    setSelectedCategories([])
    setMinPrice(0)
    setMaxPrice(MAX_PRICE)
    setPage(1)
  }

  const hasActiveFilters =
    selectedCategories.length > 0 || minPrice > 0 || maxPrice < MAX_PRICE

  const Filters = (
    <div className="space-y-6">
      {!fixedCategory && (
        <div>
          <h3 className="font-semibold text-amber-900 mb-3 text-sm uppercase tracking-wide">
            ক্যাটাগরি
          </h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                  className="w-4 h-4 accent-amber-700"
                />
                <span className="text-sm text-gray-700 group-hover:text-amber-700 transition-colors">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="font-semibold text-amber-900 mb-3 text-sm uppercase tracking-wide">
          দামের সীমা
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(Number(e.target.value))
                setPage(1)
              }}
              placeholder="সর্বনিম্ন"
              className="w-1/2 border border-amber-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value))
                setPage(1)
              }}
              placeholder="সর্বোচ্চ"
              className="w-1/2 border border-amber-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={1000}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(Number(e.target.value))
              setPage(1)
            }}
            className="w-full accent-amber-700"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>৳{minPrice.toLocaleString()}</span>
            <span>৳{maxPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="w-full text-sm text-amber-700 border border-amber-300 rounded py-1.5 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1"
        >
          <X size={14} /> ফিল্টার সরান
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">
            {search ? `"${search}" এর ফলাফল` : 'সকল পণ্য'}
          </h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} টি পণ্য পাওয়া গেছে</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setPage(1)
            }}
            className="border border-amber-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1 border border-amber-300 rounded px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50"
          >
            <SlidersHorizontal size={14} /> ফিল্টার
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-amber-100 p-5 sticky top-20">
            {Filters}
          </div>
        </aside>

        {/* Mobile filter sheet */}
        <Sheet open={mobileFiltersOpen} onOpenChange={(o) => setMobileFiltersOpen(o)}>
          <SheetContent side="left" className="overflow-y-auto p-6">
            <SheetTitle className="font-bold text-amber-900 mb-4">ফিল্টার</SheetTitle>
            {Filters}
          </SheetContent>
        </Sheet>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-amber-50 rounded-xl h-60 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl">🪑</span>
              <p className="mt-4 text-gray-500 text-lg">কোনো পণ্য পাওয়া যায়নি</p>
              <Link href="/shop" className="mt-4 inline-block text-amber-700 hover:underline">
                সব পণ্য দেখুন
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-amber-200 disabled:opacity-40 hover:bg-amber-50 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-gray-400">…</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? 'bg-amber-700 text-white'
                              : 'border border-amber-200 hover:bg-amber-50 text-gray-700'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-amber-200 disabled:opacity-40 hover:bg-amber-50 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
