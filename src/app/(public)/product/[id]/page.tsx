import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, XCircle, Package } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { ProductCard } from '@/components/product-card'
import { ProductActions, type ProductActionsProduct } from '@/components/product-actions'

// Request-time rendering: the build never queries the DB.
export const dynamic = 'force-dynamic'

type RelatedProduct = Prisma.ProductGetPayload<{ include: { category: true } }>

function toCardProduct(p: RelatedProduct) {
  return {
    id: p.id,
    name: p.name,
    sellPrice: p.sellPrice,
    images: Array.isArray(p.images) ? (p.images as unknown as string[]) : [],
    stock: p.stock,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : undefined,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { include: { parent: true } } },
  })

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-6xl mb-4">😢</p>
        <p className="text-gray-500 text-lg mb-4">পণ্যটি পাওয়া যায়নি</p>
        <Link href="/shop" className="text-amber-700 hover:underline">
          শপে ফিরুন
        </Link>
      </div>
    )
  }

  // Product.images is Json (@default "[]"); cast to a plain string[] before
  // rendering. The emoji fallback is the common path (seed has empty images).
  const images = Array.isArray(product.images) ? (product.images as unknown as string[]) : []
  const inStock = product.stock > 0
  const category = product.category
  const parentCategory = category?.parent ?? null

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      stock: { gt: 0 },
      id: { not: product.id },
    },
    include: { category: true },
    take: 4,
  })
  const related = relatedProducts.map(toCardProduct)

  const actionsProduct: ProductActionsProduct = {
    id: product.id,
    name: product.name,
    sellPrice: product.sellPrice,
    stock: product.stock,
    unit: product.unit,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-amber-700 transition-colors">হোম</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-amber-700 transition-colors">শপ</Link>
        {parentCategory && (
          <>
            <span>/</span>
            <Link
              href={`/shop/${parentCategory.slug}`}
              className="hover:text-amber-700 transition-colors"
            >
              {parentCategory.name}
            </Link>
          </>
        )}
        {category && (
          <>
            <span>/</span>
            <Link
              href={`/shop/${category.slug}`}
              className="hover:text-amber-700 transition-colors"
            >
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-amber-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative bg-amber-50 rounded-2xl overflow-hidden h-80 md:h-96 flex items-center justify-center">
            {images.length > 0 ? (
              <Image
                src={images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <span className="text-8xl">🪑</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-amber-100 shrink-0"
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
          <p className="text-3xl font-bold text-amber-800 mb-4">
            {formatCurrency(product.sellPrice)}
          </p>

          <div className="flex items-center gap-2 mb-4">
            {inStock ? (
              <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-sm font-medium">
                <CheckCircle size={14} /> স্টক আছে ({product.stock} {product.unit})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1 text-sm font-medium">
                <XCircle size={14} /> স্টক নেই
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 border-t border-amber-100 pt-6 mb-6">
            {category && (
              <div>
                <span className="text-gray-500">ক্যাটাগরি: </span>
                <Link href={`/shop/${category.slug}`} className="text-amber-700 hover:underline">
                  {category.name}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Package size={16} className="text-amber-600" />
              <span>একক: {product.unit}</span>
            </div>
            <div>
              <span className="text-gray-500">SKU: </span>
              <span className="text-gray-700">{product.sku}</span>
            </div>
            <div>
              <span className="text-gray-500">বারকোড: </span>
              <span className="text-gray-700">{product.barcode}</span>
            </div>
            {product.warranty && (
              <div className="col-span-2">
                <span className="text-gray-500">ওয়ারেন্টি: </span>
                <span className="text-amber-700 font-medium">{product.warranty}</span>
              </div>
            )}
          </div>

          <ProductActions product={actionsProduct} />
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-amber-900 mb-5">সম্পর্কিত পণ্য</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
