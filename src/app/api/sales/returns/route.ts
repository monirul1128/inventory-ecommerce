import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const returns = await prisma.saleReturn.findMany({
      include: {
        sale: { include: { customer: true } },
        product: true,
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(returns)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sale returns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { saleId, productId, qty, reason } = body

    if (!saleId || !productId || !qty) {
      return NextResponse.json({ error: 'saleId, productId, and qty are required' }, { status: 400 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const returnRecord = await prisma.$transaction(async (tx) => {
      const created = await tx.saleReturn.create({
        data: {
          saleId,
          productId,
          qty: parseFloat(String(qty)),
          reason: reason || null,
        },
        include: { sale: true, product: true },
      })

      // Add stock back
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: parseFloat(String(qty)) } },
      })

      // Stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: 'RETURN',
          qty: parseFloat(String(qty)),
          note: `Sale Return: ${sale.invoiceNo}`,
        },
      })

      // Adjust customer balance (reduce due if it exists)
      if (sale.customerId && sale.dueAmount > 0) {
        const product = await tx.product.findUnique({ where: { id: productId } })
        const returnValue = parseFloat(String(qty)) * (product?.sellPrice ?? 0)
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { balance: { decrement: Math.min(returnValue, sale.dueAmount) } },
        })
      }

      return created
    })

    return NextResponse.json(returnRecord, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create sale return'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
