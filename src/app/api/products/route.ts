import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const expiringSoon = searchParams.get('expiringSoon') === 'true'

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    // lowStock handled below with post-filter since Prisma can't compare two columns directly

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expiryDate = {
        not: null,
        lte: thirtyDaysFromNow,
      }
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Post-filter: low stock means stock <= minStock
    if (lowStock) {
      products = products.filter((p) => p.stock <= p.minStock)
    }

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      categoryId,
      unit,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      expiryDate,
      images,
      isFeatured,
      supplierId,
    } = body

    if (!name || buyPrice === undefined || sellPrice === undefined) {
      return NextResponse.json({ error: 'Name, buyPrice, and sellPrice are required' }, { status: 400 })
    }

    const sku = body.sku || `PRD-${Date.now()}`
    const barcode = body.barcode || `880${Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000)}`

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        sku,
        barcode: String(barcode),
        categoryId: categoryId || null,
        unit: unit || 'PIECE',
        buyPrice: parseFloat(buyPrice),
        sellPrice: parseFloat(sellPrice),
        stock: parseFloat(stock ?? 0),
        minStock: parseFloat(minStock ?? 5),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        images: images || [],
        isFeatured: isFeatured ?? false,
        supplierId: supplierId || null,
      },
      include: { category: true, supplier: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create product'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
