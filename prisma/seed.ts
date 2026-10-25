import { PrismaClient, Role, Unit, PaymentMethod, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@shop.com', password: hashedPassword, role: Role.ADMIN, salary: 30000 },
  })

  const staffPassword = await bcrypt.hash('staff123', 10)
  await prisma.user.upsert({
    where: { email: 'staff@shop.com' },
    update: {},
    create: { name: 'Staff User', email: 'staff@shop.com', password: staffPassword, role: Role.STAFF, salary: 15000 },
  })

  const livingRoom = await prisma.category.upsert({ where: { slug: 'living-room' }, update: {}, create: { name: 'Living Room', slug: 'living-room', image: '/images/categories/living-room.jpg' } })
  const bedroom = await prisma.category.upsert({ where: { slug: 'bedroom' }, update: {}, create: { name: 'Bedroom', slug: 'bedroom', image: '/images/categories/bedroom.jpg' } })
  const dining = await prisma.category.upsert({ where: { slug: 'dining-room' }, update: {}, create: { name: 'Dining Room', slug: 'dining-room', image: '/images/categories/dining.jpg' } })
  const office = await prisma.category.upsert({ where: { slug: 'office' }, update: {}, create: { name: 'Office', slug: 'office', image: '/images/categories/office.jpg' } })

  await prisma.category.upsert({ where: { slug: 'sofas' }, update: {}, create: { name: 'Sofas', slug: 'sofas', parentId: livingRoom.id } })
  await prisma.category.upsert({ where: { slug: 'beds' }, update: {}, create: { name: 'Beds', slug: 'beds', parentId: bedroom.id } })
  await prisma.category.upsert({ where: { slug: 'wardrobes' }, update: {}, create: { name: 'Wardrobes', slug: 'wardrobes', parentId: bedroom.id } })
  await prisma.category.upsert({ where: { slug: 'dining-tables' }, update: {}, create: { name: 'Dining Tables', slug: 'dining-tables', parentId: dining.id } })

  const supplier = await prisma.supplier.upsert({
    where: { id: 'supplier-seed-1' },
    update: {},
    create: { id: 'supplier-seed-1', name: 'Dhaka Furniture House', phone: '01711000001', email: 'dhaka@furniture.com', address: 'Mirpur, Dhaka', balance: 0 },
  })

  await prisma.customer.upsert({
    where: { id: 'customer-seed-1' },
    update: {},
    create: { id: 'customer-seed-1', name: 'Rahim Saheb', phone: '01811000001', address: 'Gulshan, Dhaka', balance: 0 },
  })

  const products = [
    { name: '3 Seater Sofa Set', sku: 'SOFA-001', barcode: '8801000000001', buyPrice: 25000, sellPrice: 35000, stock: 10, description: 'Premium 3-seater sofa set with comfortable cushioning and durable fabric.' },
    { name: 'King Size Bed', sku: 'BED-001', barcode: '8801000000002', buyPrice: 30000, sellPrice: 45000, stock: 8, description: 'Elegant king size bed with headboard and solid wood frame.' },
    { name: 'Double Door Wardrobe', sku: 'WARD-001', barcode: '8801000000003', buyPrice: 18000, sellPrice: 28000, stock: 5, description: 'Spacious double door wardrobe with mirror and multiple shelves.' },
    { name: 'Dining Table Set (6 Chair)', sku: 'DIN-001', barcode: '8801000000004', buyPrice: 22000, sellPrice: 32000, stock: 4, description: 'Complete dining set with table and 6 matching chairs.' },
    { name: 'Office Chair (Revolving)', sku: 'CHAIR-001', barcode: '8801000000005', buyPrice: 4000, sellPrice: 7000, stock: 20, description: 'Ergonomic revolving office chair with adjustable height.' },
    { name: 'TV Board', sku: 'TVB-001', barcode: '8801000000006', buyPrice: 8000, sellPrice: 14000, stock: 7, description: 'Modern TV board with cable management and storage drawers.' },
    { name: 'Bookshelf', sku: 'BOOK-001', barcode: '8801000000007', buyPrice: 5000, sellPrice: 9000, stock: 12, description: '5-tier bookshelf with sturdy construction.' },
    { name: 'Coffee Table', sku: 'COFF-001', barcode: '8801000000008', buyPrice: 3500, sellPrice: 6000, stock: 15, description: 'Elegant coffee table with tempered glass top.' },
    { name: 'Dressing Table', sku: 'DRESS-001', barcode: '8801000000009', buyPrice: 9000, sellPrice: 15000, stock: 6, description: 'Beautiful dressing table with large mirror and drawers.' },
    { name: 'Kitchen Cabinet', sku: 'KITCH-001', barcode: '8801000000010', buyPrice: 20000, sellPrice: 32000, stock: 3, description: 'Modern kitchen cabinet with ample storage space.' },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, categoryId: livingRoom.id, unit: Unit.PIECE, minStock: 3, supplierId: supplier.id, images: [], isFeatured: true },
    })
  }

  console.log('Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
