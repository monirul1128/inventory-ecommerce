import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

function generateInvoiceNo(): string {
  const date = new Date()
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const xxxx = String(Math.floor(Math.random() * 9000) + 1000)
  return `INV-${yyyymmdd}-${xxxx}`
}

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      items,
      subtotal,
      discount,
      vat,
      total,
      paidAmount,
      paymentMethod,
      note,
      date,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    const paid = parseFloat(paidAmount ?? 0)
    const tot = parseFloat(total ?? 0)
    const due = tot - paid

    let invoiceNo = generateInvoiceNo()
    let attempt = 0
    while (await prisma.sale.findUnique({ where: { invoiceNo } })) {
      invoiceNo = `INV-${Date.now()}-${++attempt}`
    }

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: customerId || null,
          subtotal: parseFloat(String(subtotal ?? tot)),
          discount: parseFloat(String(discount ?? 0)),
          vat: parseFloat(String(vat ?? 0)),
          total: tot,
          paidAmount: paid,
          dueAmount: due,
          paymentMethod: paymentMethod || 'CASH',
          date: date ? new Date(date) : new Date(),
          note: note || null,
          items: {
            create: items.map((item: { productId: string; qty: number; sellPrice: number }) => ({
              productId: item.productId,
              qty: parseFloat(String(item.qty)),
              sellPrice: parseFloat(String(item.sellPrice)),
              total: parseFloat(String(item.qty)) * parseFloat(String(item.sellPrice)),
            })),
          },
        },
        include: { customer: true, items: { include: { product: true } } },
      })

      // Deduct stock and create movements
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: parseFloat(String(item.qty)) } },
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            qty: parseFloat(String(item.qty)),
            note: `Sale: ${invoiceNo}`,
          },
        })
      }

      // Update customer balance if CREDIT
      if ((paymentMethod === 'CREDIT') && due > 0 && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { increment: due } },
        })
      }

      // Update today's CashRegister totalSales
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const cashReg = await tx.cashRegister.findUnique({ where: { date: today } })
      if (cashReg) {
        await tx.cashRegister.update({
          where: { date: today },
          data: { totalSales: { increment: tot } },
        })
      }

      return created
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create sale'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
