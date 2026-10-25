import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = {}

    if (type && (type === 'CUSTOMER' || type === 'SUPPLIER')) {
      where.type = type
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, referenceId, amount, method, note, date } = body

    if (!type || !referenceId || !amount) {
      return NextResponse.json({ error: 'type, referenceId, and amount are required' }, { status: 400 })
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          type,
          referenceId,
          amount: parseFloat(String(amount)),
          method: method || 'CASH',
          note: note || null,
          date: date ? new Date(date) : new Date(),
        },
      })

      // Reduce customer or supplier balance
      if (type === 'CUSTOMER') {
        await tx.customer.update({
          where: { id: referenceId },
          data: { balance: { decrement: parseFloat(String(amount)) } },
        })
      } else if (type === 'SUPPLIER') {
        await tx.supplier.update({
          where: { id: referenceId },
          data: { balance: { decrement: parseFloat(String(amount)) } },
        })
      }

      return created
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create payment'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
