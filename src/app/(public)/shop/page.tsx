'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductGrid } from '@/components/product-grid'

// useSearchParams must sit inside a <Suspense> boundary so the route can
// prerender its fallback cleanly (required once Cache Components is off).
function ShopContent() {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const categorySlug = searchParams.get('categorySlug') ?? ''
  const featured = searchParams.get('featured') === 'true'

  return (
    <ProductGrid
      initialSearch={search}
      initialCategorySlug={categorySlug}
      initialFeatured={featured}
    />
  )
}

function ShopSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-8 w-48 bg-amber-50 rounded animate-pulse mb-6" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-amber-100 p-5 space-y-4">
            <div className="h-4 bg-amber-50 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-amber-50 rounded animate-pulse" />
            <div className="h-4 bg-amber-50 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-amber-50 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-amber-50 rounded-xl h-60 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}
