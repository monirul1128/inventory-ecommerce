import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Role, Unit } from '@prisma/client'

export async function POST() {
  try {
    console.log('[Reseed] Starting database reseed...')

    // Create categories
    const livingRoom = await prisma.category.upsert({ 
      where: { slug: 'living-room' }, 
      update: {}, 
      create: { name: 'Living Room', slug: 'living-room' } 
    })
    
    const bedroom = await prisma.category.upsert({ 
      where: { slug: 'bedroom' }, 
      update: {}, 
      create: { name: 'Bedroom', slug: 'bedroom' } 
    })

    console.log('[Reseed] Categories created')

    // Create supplier
    const supplier = await prisma.supplier.upsert({
      where: { id: 'supplier-seed-1' },
      update: {},
      create: { 
        id: 'supplier-seed-1', 
        name: 'Dhaka Furniture House', 
        phone: '01711000001', 
        email: 'dhaka@furniture.com', 
        address: 'Mirpur, Dhaka', 
        balance: 0 
      },
    })

    console.log('[Reseed] Supplier created')

    // Create customer
    await prisma.customer.upsert({
      where: { id: 'customer-seed-1' },
      update: {},
      create: { 
        id: 'customer-seed-1', 
        name: 'Rahim Saheb', 
        phone: '01811000001', 
        address: 'Gulshan, Dhaka', 
        balance: 0 
      },
    })

    console.log('[Reseed] Customer created')

    // Create products
    const products = [
      { name: '3 Seater Sofa Set', sku: 'SOFA-001', barcode: '8801000000001', buyPrice: 25000, sellPrice: 35000, stock: 10, categoryId: livingRoom.id, warranty: '১ বছর' },
      { name: 'King Size Bed', sku: 'BED-001', barcode: '8801000000002', buyPrice: 30000, sellPrice: 45000, stock: 8, categoryId: bedroom.id, warranty: '২ বছর' },
      { name: 'Double Door Wardrobe', sku: 'WARD-001', barcode: '8801000000003', buyPrice: 18000, sellPrice: 28000, stock: 5, categoryId: bedroom.id, warranty: '১ বছর' },
      { name: 'Dining Table Set', sku: 'DIN-001', barcode: '8801000000004', buyPrice: 22000, sellPrice: 32000, stock: 4, categoryId: livingRoom.id, warranty: '৬ মাস' },
      { name: 'Office Chair', sku: 'CHAIR-001', barcode: '8801000000005', buyPrice: 4000, sellPrice: 7000, stock: 20, categoryId: livingRoom.id, warranty: '১ বছর' },
    ]

    for (const p of products) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          ...p,
          unit: Unit.PIECE,
          minStock: 5,
          isFeatured: false,
          images: [],
          supplierId: supplier.id,
        },
      })
    }

    console.log('[Reseed] Products created')

    // Get counts
    const [
      usersCount,
      productsCount,
      categoriesCount,
      suppliersCount,
      customersCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.customer.count(),
    ])

    return NextResponse.json({
      success: true,
      message: 'Database reseeded successfully',
      counts: {
        users: usersCount,
        products: productsCount,
        categories: categoriesCount,
        suppliers: suppliersCount,
        customers: customersCount,
      },
    })
  } catch (error: any) {
    console.error('[Reseed] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
