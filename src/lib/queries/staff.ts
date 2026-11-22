import { db } from '@/lib/db'
import { users, userLocationAssignments, locations, userRecurringSchedules } from '@/lib/db/schema'
import { eq, and, asc, gte, lte } from 'drizzle-orm'
import { weekdayIndex } from '@/lib/utils/schedule'

export type WeekGridShift = {
  id: string
  userId: string
  date: string
  locationId: string
  locationName: string | null
  startTime: string
  endTime: string
}

export async function getActiveUsers(tenantId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      color: users.color,
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

export async function getWeekShiftsForGrid(
  weekStart: string,
  weekEnd: string,
  tenantId: string
): Promise<WeekGridShift[]> {
  return db
    .select({
      id: userLocationAssignments.id,
      userId: userLocationAssignments.userId,
      date: userLocationAssignments.date,
      locationId: userLocationAssignments.locationId,
      locationName: locations.name,
      startTime: userLocationAssignments.startTime,
      endTime: userLocationAssignments.endTime,
    })
    .from(userLocationAssignments)
    .leftJoin(locations, eq(userLocationAssignments.locationId, locations.id))
    .where(and(
      eq(userLocationAssignments.tenantId, tenantId),
      gte(userLocationAssignments.date, weekStart),
      lte(userLocationAssignments.date, weekEnd),
    ))
    .orderBy(asc(userLocationAssignments.date), asc(userLocationAssignments.startTime))
}

export type RecurringShift = {
  id: string
  userId: string
  dayOfWeek: number
  locationId: string
  locationName: string | null
  startTime: string
  endTime: string
}

export async function getRecurringShiftsForGrid(tenantId: string): Promise<RecurringShift[]> {
  return db
    .select({
      id: userRecurringSchedules.id,
      userId: userRecurringSchedules.userId,
      dayOfWeek: userRecurringSchedules.dayOfWeek,
      locationId: userRecurringSchedules.locationId,
      locationName: locations.name,
      startTime: userRecurringSchedules.startTime,
      endTime: userRecurringSchedules.endTime,
    })
    .from(userRecurringSchedules)
    .leftJoin(locations, eq(userRecurringSchedules.locationId, locations.id))
    .where(eq(userRecurringSchedules.tenantId, tenantId))
    .orderBy(asc(userRecurringSchedules.userId), asc(userRecurringSchedules.dayOfWeek), asc(userRecurringSchedules.startTime))
}

export type StaffStatus = 'active' | 'elsewhere' | 'unassigned'

export type ShiftInfo = {
  locationId: string
  locationName: string | null
  startTime: string
  endTime: string
  status: 'active' | 'elsewhere'
}

/**
 * Chi lavora quel giorno e dove.
 *
 * Vale la stessa regola della pagina "Orario Settimanale": per ogni persona, se quel
 * giorno c'e' un turno inserito a mano vale quello, altrimenti vale il turno ricorrente.
 * Guardare le sole assegnazioni direbbe "nessuno in turno" a chi pianifica con i turni fissi.
 */
export async function getStaffStatusForDate(locationId: string, date: string, tenantId: string) {
  const dayOfWeek = weekdayIndex(date)

  const [activeUsers, dateShifts, recurringShifts] = await Promise.all([
    getActiveUsers(tenantId),
    db
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
      )),
    db
      .select({
        userId: userRecurringSchedules.userId,
        locationId: userRecurringSchedules.locationId,
        locationName: locations.name,
        startTime: userRecurringSchedules.startTime,
        endTime: userRecurringSchedules.endTime,
      })
      .from(userRecurringSchedules)
      .leftJoin(locations, eq(userRecurringSchedules.locationId, locations.id))
      .where(and(
        eq(userRecurringSchedules.tenantId, tenantId),
        eq(userRecurringSchedules.dayOfWeek, dayOfWeek)
      )),
  ])

  return activeUsers.map(user => {
    const assegnati = dateShifts.filter(s => s.userId === user.id)
    const userShifts = assegnati.length > 0
      ? assegnati
      : recurringShifts.filter(s => s.userId === user.id)
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
