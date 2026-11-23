'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { SERVICE_SPINES } from '@/lib/utils/schedule'

interface WeeklyTrendChartProps {
  data: { week: string; count: number }[]
}

const SERIE = SERVICE_SPINES[0]

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const formatted = data.map(d => ({
    label: format(parseISO(d.week), 'd MMM', { locale: it }),
    count: d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid className="stroke-border" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, className: 'fill-muted-foreground' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, className: 'fill-muted-foreground' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: 12,
            color: 'var(--foreground)',
          }}
          formatter={(v) => [v ?? 0, 'Appuntamenti']}
        />
        <Bar dataKey="count" fill={SERIE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
