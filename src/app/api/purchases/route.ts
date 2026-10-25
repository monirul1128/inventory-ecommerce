import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

function generateInvoiceNo(): string {
  const date = new Date()
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const xxxx = String(Math.floor(Math.random() * 9000) + 1000)
  return `PUR-${yyyymmdd}-${xxxx}`
}

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(purchases)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, items, paidAmount, note, date } = body

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'supplierId and items are required' }, { status: 400 })
    }

    const totalAmount: number = items.reduce(
      (sum: number, item: { qty: number; buyPrice: number }) =>
        sum + item.qty * item.buyPrice,
      0
    )
    const paid = parseFloat(paidAmount ?? 0)
    const due = totalAmount - paid

    let invoiceNo = generateInvoiceNo()
    // Ensure uniqueness
    let attempt = 0
    while (await prisma.purchase.findUnique({ where: { invoiceNo } })) {
      invoiceNo = `PUR-${Date.now()}-${++attempt}`
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          invoiceNo,
          supplierId,
          totalAmount,
          paidAmount: paid,
          dueAmount: due,
          date: date ? new Date(date) : new Date(),
          note: note || null,
          items: {
            create: items.map((item: { productId: string; qty: number; buyPrice: number }) => ({
              productId: item.productId,
              qty: parseFloat(String(item.qty)),
              buyPrice: parseFloat(String(item.buyPrice)),
              total: parseFloat(String(item.qty)) * parseFloat(String(item.buyPrice)),
            })),
          },
        },
        include: { supplier: true, items: { include: { product: true } } },
      })

      // Update stock and create movements
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: parseFloat(String(item.qty)) } },
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            qty: parseFloat(String(item.qty)),
            note: `Purchase: ${invoiceNo}`,
          },
        })
      }

      // Update supplier balance if there's due
      if (due > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { balance: { increment: due } },
        })
      }

      return created
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create purchase'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
