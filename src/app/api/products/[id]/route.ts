import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { include: { parent: true } },
        supplier: true,
        purchaseItems: { include: { purchase: true } },
        saleItems: { include: { sale: true } },
        stockMovements: { orderBy: { date: 'desc' }, take: 20 },
        damagedStocks: { orderBy: { date: 'desc' }, take: 10 },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    const fields = [
      'name', 'description', 'categoryId', 'unit', 'buyPrice', 'sellPrice',
      'stock', 'minStock', 'expiryDate', 'images', 'isFeatured', 'supplierId',
      'sku', 'barcode',
    ]

    for (const field of fields) {
      if (body[field] !== undefined) {
        if (['buyPrice', 'sellPrice', 'stock', 'minStock'].includes(field)) {
          updateData[field] = parseFloat(body[field])
        } else if (field === 'expiryDate') {
          updateData[field] = body[field] ? new Date(body[field]) : null
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, supplier: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
