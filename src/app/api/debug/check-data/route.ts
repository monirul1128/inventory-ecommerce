import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      usersCount,
      productsCount,
      categoriesCount,
      suppliersCount,
      customersCount,
      salesCount,
      ordersCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.customer.count(),
      prisma.sale.count(),
      prisma.order.count(),
    ])

    const products = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        stock: true,
        warranty: true,
      }
    })

    return NextResponse.json({
      success: true,
      counts: {
        users: usersCount,
        products: productsCount,
        categories: categoriesCount,
        suppliers: suppliersCount,
        customers: customersCount,
        sales: salesCount,
        orders: ordersCount,
      },
      sampleProducts: products,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
