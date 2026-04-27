import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarDays, TrendingUp, Wallet, Users, CalendarCheck } from 'lucide-react'
import {
  getDashboardKPIs,
  getWeeklyAppointmentsTrend,
  getMonthlyRevenueTrend,
  getServicesDistribution,
} from '@/lib/queries/dashboard'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { WeeklyTrendChart } from '@/components/dashboard/WeeklyTrendChart'
import { MonthlyRevenueChart } from '@/components/dashboard/MonthlyRevenueChart'
import { ServicesDistributionChart } from '@/components/dashboard/ServicesDistributionChart'

function calcPercentDelta(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

function formatEur(cents: number) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const tenantId = session.user.tenantId

  const [kpis, weeklyTrend, monthlyRevenue, services] = await Promise.all([
    getDashboardKPIs(tenantId),
    getWeeklyAppointmentsTrend(tenantId),
    getMonthlyRevenueTrend(tenantId),
    getServicesDistribution(tenantId),
  ])

  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: it })
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <span className="text-sm text-muted-foreground">{monthLabelCap}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Appuntamenti mese"
          value={String(kpis.appointments.curr)}
          delta={{
            value: calcPercentDelta(kpis.appointments.curr, kpis.appointments.prev),
            format: 'percent',
          }}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <KpiCard
          label="Incasso confermato"
          value={formatEur(kpis.revenue.curr)}
          delta={{
            value: calcPercentDelta(kpis.revenue.curr, kpis.revenue.prev),
            format: 'percent',
          }}
          icon={<Wallet className="h-4 w-4" />}
          highlight
        />
        <KpiCard
          label="Previsione incasso mese"
          value={formatEur(kpis.forecast.curr)}
          delta={{
            value: calcPercentDelta(kpis.forecast.curr, kpis.forecast.prev),
            format: 'percent',
          }}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Nuovi clienti mese"
          value={String(kpis.newClients.curr)}
          delta={{
            value: kpis.newClients.curr - kpis.newClients.prev,
            format: 'absolute',
          }}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Today strip */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <div className="rounded-lg border border-border bg-card px-5 py-4 flex items-center gap-4">
          <CalendarCheck className="h-5 w-5 text-brand-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Appuntamenti oggi</p>
            <p className="text-xl font-bold text-foreground">{kpis.today}</p>
          </div>
        </div>
      </div>

      {/* Charts row 1: weekly trend + services donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-4">
            Andamento settimanale — appuntamenti
          </p>
          {weeklyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
              Nessun dato disponibile
            </div>
          ) : (
            <WeeklyTrendChart data={weeklyTrend} />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-4">
            Servizi — {monthLabelCap}
          </p>
          <ServicesDistributionChart data={services} />
        </div>
      </div>

      {/* Charts row 2: monthly revenue area chart */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground mb-4">
          Ricavi mensili — ultimi 6 mesi
        </p>
        {monthlyRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            Nessun dato disponibile
          </div>
        ) : (
          <MonthlyRevenueChart data={monthlyRevenue} />
        )}
      </div>
    </div>
  )
}
