import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

// Emergency endpoint to create admin user
export async function POST() {
  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@shop.com' },
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Admin user already exists',
        user: {
          email: existing.email,
          role: existing.role,
        },
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
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

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: admin,
      credentials: {
        email: 'admin@shop.com',
        password: 'admin123',
      },
    })
  } catch (error: any) {
    console.error('[Seed Admin] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
