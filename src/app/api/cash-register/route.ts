import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || ''

    let targetDate: Date

    if (dateParam) {
      targetDate = new Date(dateParam)
      targetDate.setHours(0, 0, 0, 0)
    } else {
      targetDate = new Date()
      targetDate.setHours(0, 0, 0, 0)
    }

    const register = await prisma.cashRegister.findUnique({
      where: { date: targetDate },
    })

    if (!register) {
      return NextResponse.json(null, { status: 200 })
    }

    return NextResponse.json(register)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cash register' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { openingBalance, note } = body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await prisma.cashRegister.findUnique({ where: { date: today } })
    if (existing) {
      return NextResponse.json({ error: "Today's register already exists" }, { status: 409 })
    }

    const register = await prisma.cashRegister.create({
      data: {
        date: today,
        openingBalance: parseFloat(String(openingBalance ?? 0)),
        note: note || null,
      },
    })

    return NextResponse.json(register, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create cash register' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, closingBalance, totalExpenses, totalPurchases, note } = body

    let targetDate: Date

    if (date) {
      targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
    } else {
      targetDate = new Date()
      targetDate.setHours(0, 0, 0, 0)
    }

    const updateData: Record<string, unknown> = {}
    if (closingBalance !== undefined) updateData.closingBalance = parseFloat(String(closingBalance))
    if (totalExpenses !== undefined) updateData.totalExpenses = parseFloat(String(totalExpenses))
    if (totalPurchases !== undefined) updateData.totalPurchases = parseFloat(String(totalPurchases))
    if (note !== undefined) updateData.note = note

    const register = await prisma.cashRegister.update({
      where: { date: targetDate },
      data: updateData,
    })

    return NextResponse.json(register)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update cash register' }, { status: 500 })
  }
}
