import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { isAdminOnlyRoute } from '@/lib/auth/permissions'

export default auth((req) => {
  const isLoggedIn = !!req.auth

  const isLoginPage = req.nextUrl.pathname === '/login'
  const isAuthApi = req.nextUrl.pathname.startsWith('/api/auth')

  if (isAuthApi) {
    return NextResponse.next()
  }

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/agenda', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // RBAC: verifica ruolo per route admin-only
  if (isAdminOnlyRoute(req.nextUrl.pathname)) {
    const userRole = req.auth?.user?.role
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/agenda', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
