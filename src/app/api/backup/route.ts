import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      categories,
      suppliers,
      customers,
      products,
      purchases,
      purchaseItems,
      purchaseReturns,
      sales,
      saleItems,
      saleReturns,
      orders,
      orderItems,
      stockMovements,
      damagedStocks,
      payments,
      cashRegisters,
      expenses,
      employees,
      employeeSalaries,
      users,
    ] = await Promise.all([
      prisma.category.findMany(),
      prisma.supplier.findMany(),
      prisma.customer.findMany(),
      prisma.product.findMany(),
      prisma.purchase.findMany(),
      prisma.purchaseItem.findMany(),
      prisma.purchaseReturn.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.saleReturn.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.stockMovement.findMany(),
      prisma.damagedStock.findMany(),
      prisma.payment.findMany(),
      prisma.cashRegister.findMany(),
      prisma.expense.findMany(),
      prisma.employee.findMany(),
      prisma.employeeSalary.findMany(),
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, salary: true, createdAt: true, updatedAt: true } }),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        categories,
        suppliers,
        customers,
        products,
        purchases,
        purchaseItems,
        purchaseReturns,
        sales,
        saleItems,
        saleReturns,
        orders,
        orderItems,
        stockMovements,
        damagedStocks,
        payments,
        cashRegisters,
        expenses,
        employees,
        employeeSalaries,
        users,
      },
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const json = JSON.stringify(backup, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=backup-${dateStr}.json`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
