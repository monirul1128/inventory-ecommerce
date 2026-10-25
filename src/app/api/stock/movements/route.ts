import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || ''

    const where: Record<string, unknown> = {}

    if (productId) {
      where.productId = productId
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { include: { category: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(movements)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
  }
}
