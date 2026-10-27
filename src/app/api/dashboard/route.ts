import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const todayRange = { gte: today, lt: tomorrow }

    const [
      todaySales,
      totalProducts,
      allProductStocks,
      expiringProducts,
      pendingOrders,
      recentSales,
      totalCategories,
      totalSuppliers,
      totalCustomers,
      totalSalesCount,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: { date: todayRange },
        include: {
          items: { include: { product: true } },
        },
      }),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, stock: true, minStock: true },
      }),
      prisma.product.count({
        where: {
          expiryDate: { not: null, lte: thirtyDaysFromNow },
        },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.sale.findMany({
        where: { date: todayRange },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.customer.count(),
      prisma.sale.count(),
    ])

    const lowStockCount = allProductStocks.filter((p) => p.stock <= p.minStock).length

    const todaySalesCount = todaySales.length
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    const todayCOGS = todaySales.reduce((sum, s) => {
      return (
        sum +
        s.items.reduce((iSum, item) => iSum + item.qty * (item.product?.buyPrice ?? 0), 0)
      )
    }, 0)
    const todayProfit = todayRevenue - todayCOGS

    // Top 5 products today by qty
    const productSalesMap = new Map<
      string,
      { product: (typeof todaySales)[0]['items'][0]['product']; qty: number; revenue: number }
    >()
    for (const sale of todaySales) {
      for (const item of sale.items) {
        const existing = productSalesMap.get(item.productId)
        if (existing) {
          existing.qty += item.qty
          existing.revenue += item.total
        } else {
          productSalesMap.set(item.productId, {
            product: item.product,
            qty: item.qty,
            revenue: item.total,
          })
        }
      }
    }
    const topProductsToday = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return NextResponse.json({
      todaySalesCount,
      todayRevenue,
      todayProfit,
      totalProducts,
      lowStockCount,
      expiringSoonCount: expiringProducts,
      pendingOrdersCount: pendingOrders,
      totalCategories,
      totalSuppliers,
      totalCustomers,
      totalSales: totalSalesCount,
      topProductsToday,
      recentSales,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
