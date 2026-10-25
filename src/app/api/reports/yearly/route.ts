import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year + 1, 0, 1)

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lt: endDate } },
      }),
    ])

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const monthStr = `${year}-${String(m).padStart(2, '0')}`
      const monthSales = sales.filter((s) => {
        const d = new Date(s.date)
        return d.getFullYear() === year && d.getMonth() + 1 === m
      })
      const monthExpenses = expenses.filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === year && d.getMonth() + 1 === m
      })

      const totalSales = monthSales.reduce((sum, s) => sum + s.total, 0)
      const totalCOGS = monthSales.reduce((sum, s) => {
        return sum + s.items.reduce((iSum, item) => iSum + item.qty * (item.product?.buyPrice ?? 0), 0)
      }, 0)
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      const grossProfit = totalSales - totalCOGS
      const netProfit = grossProfit - totalExpenses

      return { month: monthStr, totalSales, totalCOGS, totalExpenses, grossProfit, netProfit }
    })

    return NextResponse.json({ year, monthlyData })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch yearly report' }, { status: 500 })
  }
}
