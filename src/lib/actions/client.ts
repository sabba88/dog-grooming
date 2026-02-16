import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth/auth'

const handleServerError = (e: Error) => {
  console.error('Action error:', e.message)
  return e.message
}

export const actionClient = createSafeActionClient({
  handleServerError,
})

export const authActionClient = createSafeActionClient({
  handleServerError,
}).use(async ({ next }) => {
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
