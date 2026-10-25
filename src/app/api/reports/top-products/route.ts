import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const saleWhere: Record<string, unknown> = {}

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        dateFilter.lte = end
      }
      saleWhere.date = dateFilter
    }

    const sales = await prisma.sale.findMany({
      where: saleWhere,
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    })

    // Aggregate by product
    const productMap = new Map<
      string,
      {
        product: (typeof sales)[0]['items'][0]['product']
        totalQty: number
        totalRevenue: number
      }
    >()

    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.totalQty += item.qty
          existing.totalRevenue += item.total
        } else {
          productMap.set(item.productId, {
            product: item.product,
            totalQty: item.qty,
            totalRevenue: item.total,
          })
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 20)

    return NextResponse.json(topProducts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch top products' }, { status: 500 })
  }
}
