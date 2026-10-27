import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'furniture-pos-secret-2024')

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log('[Admin Login] Attempt for:', email)

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    })

    if (!user) {
      console.log('[Admin Login] User not found')
      return NextResponse.json(
        { success: false, error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      console.log('[Admin Login] Invalid password')
      return NextResponse.json(
        { success: false, error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      )
    }

    console.log('[Admin Login] Success for:', user.email, 'Role:', user.role)

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    // Set session cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('[Admin Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'সার্ভার সমস্যা হয়েছে' },
      { status: 500 }
    )
  }
}
