import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const targetDate = new Date(dateParam)
    targetDate.setHours(0, 0, 0, 0)

    const nextDate = new Date(targetDate)
    nextDate.setDate(nextDate.getDate() + 1)

    const dateRange = {
      gte: targetDate,
      lt: nextDate,
    }

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { date: dateRange },
        include: {
          items: { include: { product: true } },
          customer: true,
        },
      }),
      prisma.expense.findMany({
        where: { date: dateRange },
      }),
    ])

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0)

    const totalCOGS = sales.reduce((sum, s) => {
      const cogsSale = s.items.reduce((itemSum, item) => {
        return itemSum + item.qty * (item.product?.buyPrice ?? 0)
      }, 0)
      return sum + cogsSale
    }, 0)

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const grossProfit = totalSales - totalCOGS
    const netProfit = grossProfit - totalExpenses

    return NextResponse.json({
      date: dateParam,
      totalSales,
      totalCOGS,
      totalExpenses,
      grossProfit,
      netProfit,
      sales,
      expenses,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 })
  }
}
