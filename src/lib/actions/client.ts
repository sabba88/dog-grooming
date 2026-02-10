import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth/auth'

export const actionClient = createSafeActionClient()

export const authActionClient = createSafeActionClient().use(async ({ next }) => {
  const session = await auth()

  if (!session?.user) {
    throw new Error('Non autenticato')
  }

  return next({
    ctx: {
      userId: session.user.id,
      role: session.user.role,
      tenantId: session.user.tenantId,
    },
  })
})
