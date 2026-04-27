import { db } from '@/lib/db'
import { users, userLocationAssignments, locations } from '@/lib/db/schema'
import { eq, and, asc, gte, lte } from 'drizzle-orm'

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
      date: userLocationAssignments.date,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(and(
      eq(userLocationAssignments.userId, userId),
      eq(userLocationAssignments.tenantId, tenantId)
    ))
    .orderBy(asc(userLocationAssignments.date), asc(userLocationAssignments.startTime))
}

export async function getAllUsersWithAssignments(tenantId: string) {
  const activeUsers = await getActiveUsers(tenantId)

  const allAssignments = await db
    .select({
      id: userLocationAssignments.id,
      userId: userLocationAssignments.userId,
      locationId: userLocationAssignments.locationId,
      locationName: locations.name,
      date: userLocationAssignments.date,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(eq(userLocationAssignments.tenantId, tenantId))
    .orderBy(asc(userLocationAssignments.date), asc(userLocationAssignments.startTime))

  return activeUsers.map(user => ({
    ...user,
    assignments: allAssignments.filter(a => a.userId === user.id),
  }))
}

export async function getWeeklyStaffShifts(
  weekStart: string,
  weekEnd: string,
  locationId: string,
  tenantId: string
): Promise<Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]>> {
  const rows = await db
    .select({
      userId: userLocationAssignments.userId,
      date: userLocationAssignments.date,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .where(
      and(
        eq(userLocationAssignments.locationId, locationId),
        eq(userLocationAssignments.tenantId, tenantId),
        gte(userLocationAssignments.date, weekStart),
        lte(userLocationAssignments.date, weekEnd)
      )
    )
    .orderBy(asc(userLocationAssignments.date), asc(userLocationAssignments.startTime))

  const result: Record<string, { date: string; shifts: { startTime: string; endTime: string }[] }[]> = {}

  for (const row of rows) {
    if (!result[row.userId]) result[row.userId] = []
    const userEntries = result[row.userId]
    const dateEntry = userEntries.find(e => e.date === row.date)
    if (dateEntry) {
      dateEntry.shifts.push({ startTime: row.startTime, endTime: row.endTime })
    } else {
      userEntries.push({ date: row.date, shifts: [{ startTime: row.startTime, endTime: row.endTime }] })
    }
  }

  return result
}

export type StaffStatus = 'active' | 'elsewhere' | 'unassigned'

export type ShiftInfo = {
  locationId: string
  locationName: string | null
  startTime: string
  endTime: string
  status: 'active' | 'elsewhere'
}

export async function getStaffStatusForDate(locationId: string, date: string, tenantId: string) {
  const activeUsers = await getActiveUsers(tenantId)

  const dateShifts = await db
    .select({
      userId: userLocationAssignments.userId,
      locationId: userLocationAssignments.locationId,
      locationName: locations.name,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(and(
      eq(userLocationAssignments.tenantId, tenantId),
      eq(userLocationAssignments.date, date)
    ))

  return activeUsers.map(user => {
    const userShifts = dateShifts.filter(s => s.userId === user.id)
    const shifts: ShiftInfo[] = userShifts.map(s => ({
      locationId: s.locationId,
      locationName: s.locationName,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.locationId === locationId ? 'active' : 'elsewhere',
    }))

    const overallStatus: StaffStatus = shifts.length === 0
      ? 'unassigned'
      : shifts.some(s => s.status === 'active')
        ? 'active'
        : 'elsewhere'

    return { ...user, overallStatus, shifts }
  })
}
