import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const salaries = await prisma.employeeSalary.findMany({
      include: {
        employee: true,
      },
      orderBy: { paidAt: 'desc' },
    })
    return NextResponse.json(salaries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch salary payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, month, year, amount } = body

    if (!employeeId || !month || !year || amount === undefined) {
      return NextResponse.json(
        { error: 'employeeId, month, year, and amount are required' },
        { status: 400 }
      )
    }

    const salary = await prisma.employeeSalary.create({
      data: {
        employeeId,
        month: parseInt(String(month), 10),
        year: parseInt(String(year), 10),
        amount: parseFloat(String(amount)),
      },
      include: { employee: true },
    })

    return NextResponse.json(salary, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create salary payment' }, { status: 500 })
  }
}
