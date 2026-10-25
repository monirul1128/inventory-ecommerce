import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as { role: string }).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    if (!body?.data) {
      return NextResponse.json({ error: 'Invalid backup format: missing data key' }, { status: 400 })
    }

    const { data } = body

    // Run everything in a transaction
    await prisma.$transaction(
      async (tx) => {
        // Clear in reverse dependency order
        await tx.employeeSalary.deleteMany()
        await tx.employee.deleteMany()
        await tx.damagedStock.deleteMany()
        await tx.stockMovement.deleteMany()
        await tx.orderItem.deleteMany()
        await tx.order.deleteMany()
        await tx.saleReturn.deleteMany()
        await tx.saleItem.deleteMany()
        await tx.sale.deleteMany()
        await tx.purchaseReturn.deleteMany()
        await tx.purchaseItem.deleteMany()
        await tx.purchase.deleteMany()
        await tx.payment.deleteMany()
        await tx.cashRegister.deleteMany()
        await tx.expense.deleteMany()
        await tx.product.deleteMany()
        await tx.category.deleteMany()
        await tx.customer.deleteMany()
        await tx.supplier.deleteMany()

        // Restore in dependency order
        if (data.categories?.length) await tx.category.createMany({ data: data.categories, skipDuplicates: true })
        if (data.suppliers?.length) await tx.supplier.createMany({ data: data.suppliers, skipDuplicates: true })
        if (data.customers?.length) await tx.customer.createMany({ data: data.customers, skipDuplicates: true })
        if (data.products?.length) await tx.product.createMany({ data: data.products, skipDuplicates: true })
        if (data.purchases?.length) await tx.purchase.createMany({ data: data.purchases, skipDuplicates: true })
        if (data.purchaseItems?.length) await tx.purchaseItem.createMany({ data: data.purchaseItems, skipDuplicates: true })
        if (data.purchaseReturns?.length) await tx.purchaseReturn.createMany({ data: data.purchaseReturns, skipDuplicates: true })
        if (data.sales?.length) await tx.sale.createMany({ data: data.sales, skipDuplicates: true })
        if (data.saleItems?.length) await tx.saleItem.createMany({ data: data.saleItems, skipDuplicates: true })
        if (data.saleReturns?.length) await tx.saleReturn.createMany({ data: data.saleReturns, skipDuplicates: true })
        if (data.orders?.length) await tx.order.createMany({ data: data.orders, skipDuplicates: true })
        if (data.orderItems?.length) await tx.orderItem.createMany({ data: data.orderItems, skipDuplicates: true })
        if (data.stockMovements?.length) await tx.stockMovement.createMany({ data: data.stockMovements, skipDuplicates: true })
        if (data.damagedStocks?.length) await tx.damagedStock.createMany({ data: data.damagedStocks, skipDuplicates: true })
        if (data.payments?.length) await tx.payment.createMany({ data: data.payments, skipDuplicates: true })
        if (data.cashRegisters?.length) await tx.cashRegister.createMany({ data: data.cashRegisters, skipDuplicates: true })
        if (data.expenses?.length) await tx.expense.createMany({ data: data.expenses, skipDuplicates: true })
        if (data.employees?.length) await tx.employee.createMany({ data: data.employees, skipDuplicates: true })
        if (data.employeeSalaries?.length) await tx.employeeSalary.createMany({ data: data.employeeSalaries, skipDuplicates: true })
      },
      { timeout: 60000 }
    )

    return NextResponse.json({ success: true, message: 'Data restored successfully' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to restore data'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
