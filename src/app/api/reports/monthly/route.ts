import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10)

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lt: endDate } },
      }),
    ])

    // Build day-by-day map
    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const daySales = sales.filter((s) => {
        const d = new Date(s.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day
      })
      const dayExpenses = expenses.filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day
      })

      const totalSales = daySales.reduce((sum, s) => sum + s.total, 0)
      const totalCOGS = daySales.reduce((sum, s) => {
        return sum + s.items.reduce((iSum, item) => iSum + item.qty * (item.product?.buyPrice ?? 0), 0)
      }, 0)
      const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      const grossProfit = totalSales - totalCOGS
      const netProfit = grossProfit - totalExpenses

      return { date: dayStr, totalSales, totalCOGS, totalExpenses, grossProfit, netProfit }
    })

    return NextResponse.json({
      year,
      month,
      dailyData,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch monthly report' }, { status: 500 })
  }
}
