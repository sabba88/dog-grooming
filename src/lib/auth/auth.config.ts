import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string
        token.role = (user as { role: string }).role
        token.tenantId = (user as { tenantId: string }).tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
  },
}
