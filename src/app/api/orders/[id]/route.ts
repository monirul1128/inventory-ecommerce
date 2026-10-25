import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = order.status

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(note !== undefined && { note }),
        },
        include: { items: { include: { product: true } } },
      })

      // Deduct stock when PROCESSING
      if (status === 'PROCESSING' && previousStatus !== 'PROCESSING') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              qty: item.qty,
              note: `Order: ${order.orderNo}`,
            },
          })
        }
      }

      // Add stock back when CANCELLED (only if stock was deducted)
      if (status === 'CANCELLED' && previousStatus === 'PROCESSING') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.qty } },
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'RETURN',
              qty: item.qty,
              note: `Order Cancelled: ${order.orderNo}`,
            },
          })
        }
      }

      return updatedOrder
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update order'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
