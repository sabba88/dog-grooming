'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface MonthlyRevenueChartProps {
  data: { month: string; revenue: number }[]
}

function formatEur(cents: number) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const formatted = data.map(d => ({
    label: format(parseISO(d.month), 'MMM yy', { locale: it }),
    revenue: d.revenue,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 16, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4BBFC8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4BBFC8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          formatter={(v) => [formatEur(Number(v ?? 0)), 'Incasso']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#4BBFC8"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
