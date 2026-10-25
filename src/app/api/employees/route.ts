import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        payments: { orderBy: { paidAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, role, salary, joiningDate } = body

    if (!name || !phone || !role || salary === undefined || !joiningDate) {
      return NextResponse.json(
        { error: 'name, phone, role, salary, and joiningDate are required' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        phone,
        role,
        salary: parseFloat(String(salary)),
        joiningDate: new Date(joiningDate),
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
