import { db } from '@/lib/db'
import { appointments, clients, services } from '@/lib/db/schema'
import { eq, and, gte, lt, lte, count, sum, asc, sql } from 'drizzle-orm'

function monthBounds(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  }
}

export async function getDashboardKPIs(tenantId: string) {
  const now = new Date()
  const curr = monthBounds(now.getFullYear(), now.getMonth())
  const prev = monthBounds(now.getFullYear(), now.getMonth() - 1)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const [
    [currAppts],
    [prevAppts],
    [currRevenue],
    [prevRevenue],
    [currForecast],
    [prevForecast],
    [currClients],
    [prevClients],
    [todayAppts],
  ] = await Promise.all([
    db.select({ v: count() }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, curr.start),
      lt(appointments.startTime, curr.end),
    )),
    db.select({ v: count() }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, prev.start),
      lt(appointments.startTime, prev.end),
    )),
    db.select({ v: sum(appointments.price) }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, curr.start),
      lt(appointments.startTime, curr.end),
      lte(appointments.startTime, now),
    )),
    db.select({ v: sum(appointments.price) }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, prev.start),
      lt(appointments.startTime, prev.end),
    )),
    db.select({ v: sum(appointments.price) }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, curr.start),
      lt(appointments.startTime, curr.end),
    )),
    db.select({ v: sum(appointments.price) }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, prev.start),
      lt(appointments.startTime, prev.end),
    )),
    db.select({ v: count() }).from(clients).where(and(
      eq(clients.tenantId, tenantId),
      gte(clients.createdAt, curr.start),
      lt(clients.createdAt, curr.end),
    )),
    db.select({ v: count() }).from(clients).where(and(
      eq(clients.tenantId, tenantId),
      gte(clients.createdAt, prev.start),
      lt(clients.createdAt, prev.end),
    )),
    db.select({ v: count() }).from(appointments).where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, todayStart),
      lt(appointments.startTime, todayEnd),
    )),
  ])

  return {
    appointments: { curr: currAppts.v, prev: prevAppts.v },
    revenue: { curr: Number(currRevenue.v ?? 0), prev: Number(prevRevenue.v ?? 0) },
    forecast: { curr: Number(currForecast.v ?? 0), prev: Number(prevForecast.v ?? 0) },
    newClients: { curr: currClients.v, prev: prevClients.v },
    today: todayAppts.v,
  }
}

export async function getWeeklyAppointmentsTrend(tenantId: string) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 56)

  const rows = await db
    .select({
      week: sql<string>`DATE_TRUNC('week', ${appointments.startTime})::date::text`,
      count: count(),
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), gte(appointments.startTime, cutoff)))
    .groupBy(sql`DATE_TRUNC('week', ${appointments.startTime})`)
    .orderBy(sql`DATE_TRUNC('week', ${appointments.startTime})`)

  return rows
}

export async function getMonthlyRevenueTrend(tenantId: string) {
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const rows = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${appointments.startTime})::date::text`,
      revenue: sum(appointments.price),
    })
    .from(appointments)
    .where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, cutoff),
      lte(appointments.startTime, now),
    ))
    .groupBy(sql`DATE_TRUNC('month', ${appointments.startTime})`)
    .orderBy(sql`DATE_TRUNC('month', ${appointments.startTime})`)

  return rows.map(r => ({ month: r.month, revenue: Number(r.revenue ?? 0) }))
}

export async function getServicesDistribution(tenantId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const rows = await db
    .select({
      name: services.name,
      count: count(),
      revenue: sum(appointments.price),
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startTime, monthStart),
      lt(appointments.startTime, monthEnd),
    ))
    .groupBy(services.name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5)

  return rows.map(r => ({ name: r.name, count: r.count, revenue: Number(r.revenue ?? 0) }))
}
