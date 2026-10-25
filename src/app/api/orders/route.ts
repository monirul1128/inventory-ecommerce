import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

function generateOrderNo(): string {
  const date = new Date()
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const xxxx = String(Math.floor(Math.random() * 9000) + 1000)
  return `ORD-${yyyymmdd}-${xxxx}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const phone = searchParams.get('phone') || ''

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (phone) {
      where.phone = { contains: phone }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      phone,
      address,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
      note,
    } = body

    if (!customerName || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'customerName, phone, address, and items are required' },
        { status: 400 }
      )
    }

    // Validate stock availability
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }
      if (product.stock < item.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    let orderNo = generateOrderNo()
    let attempt = 0
    while (await prisma.order.findUnique({ where: { orderNo } })) {
      orderNo = `ORD-${Date.now()}-${++attempt}`
    }

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerName,
        phone,
        address,
        subtotal: parseFloat(String(subtotal ?? total)),
        discount: parseFloat(String(discount ?? 0)),
        total: parseFloat(String(total)),
        paymentMethod: paymentMethod || 'COD',
        note: note || null,
        items: {
          create: items.map((item: { productId: string; qty: number; price: number }) => ({
            productId: item.productId,
            qty: parseInt(String(item.qty), 10),
            price: parseFloat(String(item.price)),
            total: parseInt(String(item.qty), 10) * parseFloat(String(item.price)),
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
