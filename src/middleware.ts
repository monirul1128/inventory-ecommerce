import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Check auth token
  const token = req.cookies.get('auth-token')?.value

  if (!token) {
    console.log('[Middleware] No token, redirecting to login')
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    console.log('[Middleware] Valid token for:', payload.email)

    // Staff restrictions
    const staffBlocked = ['/admin/reports', '/admin/settings']
    if (payload.role === 'STAFF' && staffBlocked.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.log('[Middleware] Invalid token:', error)
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = { 
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] 
}
