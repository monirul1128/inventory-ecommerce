import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Debug endpoint to check if users exist in database
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
