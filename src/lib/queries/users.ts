import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getUsers(tenantId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(asc(users.name))
}

export async function getUserById(userId: string, tenantId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1)

  return user ?? null
}
