import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/product-grid'

// Request-time rendering: the build never queries the DB.
export const dynamic = 'force-dynamic'

export default async function CategoryShopPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  })
  // Fall back to the slug when the category is missing; the grid still
  // renders (it will show its empty state) while the breadcrumb stays generic.
  const categoryName = category?.name ?? categorySlug

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-sm text-gray-500 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-amber-700 transition-colors">হোম</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-amber-700 transition-colors">শপ</Link>
        <span>/</span>
        <span className="text-amber-900 font-medium">{categoryName}</span>
      </nav>

      <ProductGrid
        categorySlug={categorySlug}
        fixedCategory
        initialCategorySlug={categorySlug}
      />
    </div>
  )
}
