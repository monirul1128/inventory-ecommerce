import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/product-card'

// Server pages run at request time (`force-dynamic`), so the build never
// touches the DB. Prisma's `Product.images` is `Json`; we cast it to a plain
// `string[]` here before handing it to the client `ProductCard`.
export const dynamic = 'force-dynamic'

interface SerializableProduct {
  id: string
  name: string
  sellPrice: number
  images: string[]
  stock: number
  unit: string
  category?: { name: string; slug: string }
}

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>

function toSerializableProduct(p: ProductWithCategory): SerializableProduct {
  const rawImages = p.images
  const images = Array.isArray(rawImages) ? (rawImages as unknown as string[]) : []
  return {
    id: p.id,
    name: p.name,
    sellPrice: p.sellPrice,
    images,
    stock: p.stock,
    unit: p.unit,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : undefined,
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  default: '🪑',
  sofa: '🛋️',
  bed: '🛏️',
  table: '🪞',
  chair: '🪑',
  wardrobe: '🗄️',
  office: '💼',
}

function categoryEmoji(slug: string): string {
  return CATEGORY_ICONS[slug.toLowerCase()] || CATEGORY_ICONS.default
}

export default async function HomePage() {
  const [featuredProducts, newProducts, categories, topSaleItems] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true, stock: { gt: 0 } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.product.findMany({
      where: { stock: { gt: 0 } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: 6,
    }),
  ])

  // Best sellers: keep the groupBy order, only in-stock products. When there
  // are no sales yet the section stays hidden (bestSellers stays empty).
  let bestSellers: SerializableProduct[] = []
  if (topSaleItems.length > 0) {
    const topIds = topSaleItems.map((t) => t.productId)
    const bestProducts = await prisma.product.findMany({
      where: { id: { in: topIds }, stock: { gt: 0 } },
      include: { category: true },
    })
    bestSellers = topIds
      .map((id) => bestProducts.find((p) => p.id === id))
      .filter((p): p is ProductWithCategory => Boolean(p))
      .map(toSerializableProduct)
  }

  const featured = featuredProducts.map(toSerializableProduct)
  const newArrivals = newProducts.map(toSerializableProduct)

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-800 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              আপনার ঘরের জন্য সেরা ফার্নিচার
            </h1>
            <p className="text-amber-100 text-lg mb-8">
              উন্নত মানের ফার্নিচার, সাশ্রয়ী মূল্যে। আমাদের বিশাল কালেকশন থেকে বেছে নিন আপনার পছন্দের পণ্য।
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-amber-900 font-bold px-8 py-3 rounded-full hover:bg-amber-50 transition-colors text-lg"
            >
              কেনাকাটা শুরু করুন <ArrowRight size={20} />
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-[160px] leading-none select-none">🪑</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-14 bg-amber-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-8 text-center">ক্যাটাগরি</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/${cat.slug}`}
                  className="bg-white rounded-xl p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-amber-300 border border-transparent transition-all text-center"
                >
                  {cat.image ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image 
                        src={cat.image} 
                        alt={cat.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-4xl">{categoryEmoji(cat.slug)}</span>
                  )}
                  <span className="text-sm font-medium text-amber-900">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                <Star className="text-amber-500 fill-amber-500" size={24} /> ফিচার্ড পণ্য
              </h2>
              <Link
                href="/shop?featured=true"
                className="text-amber-700 hover:text-amber-900 text-sm font-medium flex items-center gap-1"
              >
                সব দেখুন <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-14 bg-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-amber-900">🆕 নতুন পণ্য</h2>
              <Link
                href="/shop?sort=newest"
                className="text-amber-700 hover:text-amber-900 text-sm font-medium flex items-center gap-1"
              >
                সব দেখুন <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-8">🔥 বেস্ট সেলার</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-amber-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">এখনই অর্ডার করুন</h2>
          <p className="text-amber-100 mb-8">
            ক্যাশ অন ডেলিভারি সুবিধায় ঘরে বসেই পান আপনার পছন্দের ফার্নিচার।
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-white text-amber-900 font-bold px-8 py-3 rounded-full hover:bg-amber-50 transition-colors text-lg"
          >
            পণ্য দেখুন <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
