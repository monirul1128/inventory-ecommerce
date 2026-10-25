import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  // Public routes: anything not under /admin (except /admin/login)
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next()
  }
  // Admin routes require auth
  if (!req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  // Staff cannot access reports, settings
  const staffBlocked = ['/admin/reports', '/admin/settings']
  if ((req.auth.user as any)?.role === 'STAFF' && staffBlocked.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }
  return NextResponse.next()
})

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
