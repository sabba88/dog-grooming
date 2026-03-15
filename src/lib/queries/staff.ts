import { db } from '@/lib/db'
import { users, userLocationAssignments, locations } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getActiveUsers(tenantId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)))
    .orderBy(asc(users.name))
}

export async function getUserAssignments(userId: string, tenantId: string) {
  return db
    .select({
      id: userLocationAssignments.id,
      userId: userLocationAssignments.userId,
      locationId: userLocationAssignments.locationId,
      locationName: locations.name,
      dayOfWeek: userLocationAssignments.dayOfWeek,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(and(
      eq(userLocationAssignments.userId, userId),
      eq(userLocationAssignments.tenantId, tenantId)
    ))
    .orderBy(asc(userLocationAssignments.dayOfWeek))
}

export async function getAllUsersWithAssignments(tenantId: string) {
  const activeUsers = await getActiveUsers(tenantId)

  const allAssignments = await db
    .select({
      id: userLocationAssignments.id,
      userId: userLocationAssignments.userId,
      locationId: userLocationAssignments.locationId,
      locationName: locations.name,
      dayOfWeek: userLocationAssignments.dayOfWeek,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(eq(userLocationAssignments.tenantId, tenantId))
    .orderBy(asc(userLocationAssignments.dayOfWeek))

  return activeUsers.map(user => ({
    ...user,
    assignments: allAssignments.filter(a => a.userId === user.id),
  }))
}

export async function getStaffByLocation(locationId: string, tenantId: string) {
  return db
    .select({
      id: userLocationAssignments.id,
      userId: userLocationAssignments.userId,
      userName: users.name,
      userRole: users.role,
      dayOfWeek: userLocationAssignments.dayOfWeek,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(users, eq(userLocationAssignments.userId, users.id))
    .where(and(
      eq(userLocationAssignments.locationId, locationId),
      eq(userLocationAssignments.tenantId, tenantId)
    ))
    .orderBy(asc(users.name), asc(userLocationAssignments.dayOfWeek))
}

/**
 * Converte il giorno JavaScript (0=Dom) in ISO 8601 (0=Lun)
 */
export function getIsoDayOfWeek(date: Date): number {
  const jsDay = date.getDay() // 0=Dom, 1=Lun, ..., 6=Sab
  return jsDay === 0 ? 6 : jsDay - 1 // Dom→6, Lun→0, Mar→1, ...
}

export type StaffStatus = 'active' | 'elsewhere' | 'unassigned'

export async function getStaffStatusForDate(locationId: string, date: Date, tenantId: string) {
  const dayOfWeek = getIsoDayOfWeek(date)

  const activeUsers = await getActiveUsers(tenantId)

  const todayAssignments = await db
    .select({
      userId: userLocationAssignments.userId,
      locationId: userLocationAssignments.locationId,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .where(and(
      eq(userLocationAssignments.tenantId, tenantId),
      eq(userLocationAssignments.dayOfWeek, dayOfWeek)
    ))

  return activeUsers.map(user => {
    const assignment = todayAssignments.find(a => a.userId === user.id)
    let status: StaffStatus = 'unassigned'

    if (assignment) {
      status = assignment.locationId === locationId ? 'active' : 'elsewhere'
    }

    return {
      ...user,
      status,
      assignment: assignment ?? null,
    }
  })
}
