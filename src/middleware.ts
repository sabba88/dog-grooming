import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth/auth.config'
import { NextResponse } from 'next/server'
import { isAdminOnlyRoute } from '@/lib/auth/permissions'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth

  const isLoginPage = req.nextUrl.pathname === '/login'
  const isAuthApi = req.nextUrl.pathname.startsWith('/api/auth')
  // Assistente vocale: le chiama Fish durante la telefonata, senza sessione.
  // Si autenticano da sole (token o firma del webhook): vedi src/lib/voce/http.ts.
  const isVoiceApi = req.nextUrl.pathname.startsWith('/api/voce/')

  if (isAuthApi || isVoiceApi) {
    return NextResponse.next()
  }

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/bookings', req.url))
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
      return NextResponse.redirect(new URL('/bookings', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
