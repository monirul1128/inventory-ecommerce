import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const returns = await prisma.purchaseReturn.findMany({
      include: {
        purchase: { include: { supplier: true } },
        product: true,
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(returns)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase returns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { purchaseId, productId, qty, reason } = body

    if (!purchaseId || !productId || !qty) {
      return NextResponse.json({ error: 'purchaseId, productId, and qty are required' }, { status: 400 })
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { supplier: true },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const returnRecord = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseReturn.create({
        data: {
          purchaseId,
          productId,
          qty: parseFloat(String(qty)),
          reason: reason || null,
        },
        include: { purchase: true, product: true },
      })

      // Reduce stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: parseFloat(String(qty)) } },
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: 'RETURN',
          qty: parseFloat(String(qty)),
          note: `Purchase Return: ${purchase.invoiceNo}`,
        },
      })

      // Reduce supplier balance
      const product = await tx.product.findUnique({ where: { id: productId } })
      const returnValue = parseFloat(String(qty)) * (product?.buyPrice ?? 0)
      if (returnValue > 0) {
        await tx.supplier.update({
          where: { id: purchase.supplierId },
          data: { balance: { decrement: returnValue } },
        })
      }

      return created
    })

    return NextResponse.json(returnRecord, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create purchase return'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
