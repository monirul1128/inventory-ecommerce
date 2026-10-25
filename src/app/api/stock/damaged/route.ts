import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const damaged = await prisma.damagedStock.findMany({
      include: {
        product: { include: { category: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(damaged)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch damaged stocks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, qty, reason, date } = body

    if (!productId || !qty) {
      return NextResponse.json({ error: 'productId and qty are required' }, { status: 400 })
    }

    const damaged = await prisma.$transaction(async (tx) => {
      const created = await tx.damagedStock.create({
        data: {
          productId,
          qty: parseFloat(String(qty)),
          reason: reason || null,
          date: date ? new Date(date) : new Date(),
        },
        include: { product: true },
      })

      // Deduct stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: parseFloat(String(qty)) } },
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: 'DAMAGE',
          qty: parseFloat(String(qty)),
          note: reason || 'Damaged stock',
        },
      })

      return created
    })

    return NextResponse.json(damaged, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create damaged stock'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
