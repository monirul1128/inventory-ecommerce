import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

// Fix admin password by deleting and recreating with correct hash
export async function POST() {
  try {
    // Delete existing admin
    await prisma.user.deleteMany({
      where: { email: 'admin@shop.com' },
    })

    console.log('[Fix Admin] Deleted old admin user')

    // Create new admin with fresh password hash
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    console.log('[Fix Admin] Generated new password hash')

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@shop.com',
        password: hashedPassword,
        role: Role.ADMIN,
        salary: 30000,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    console.log('[Fix Admin] Created new admin:', admin.email)

    // Verify the password immediately
    const user = await prisma.user.findUnique({
      where: { email: 'admin@shop.com' },
    })

    const isValid = await bcrypt.compare('admin123', user!.password)

    return NextResponse.json({
      success: true,
      message: 'Admin password fixed successfully',
      admin,
      passwordVerified: isValid,
      credentials: {
        email: 'admin@shop.com',
        password: 'admin123',
      },
    })
  } catch (error: any) {
    console.error('[Fix Admin] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
