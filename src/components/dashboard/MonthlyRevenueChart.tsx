'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { SERVICE_SPINES } from '@/lib/utils/schedule'

interface MonthlyRevenueChartProps {
  data: { month: string; revenue: number }[]
}

// Serie unica: prende il primo colore della serie categoriale. Il teal di marca
// resta all'interfaccia (bottoni, selezione), i dati usano la serie verificata.
const SERIE = SERVICE_SPINES[0]

function formatEur(cents: number) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

// I colori del tema sono esadecimali, non canali HSL: dentro hsl() non sono CSS
// valido e recharts cadeva sui suoi default. Griglia ed etichette li prendono da
// una classe, che risolve la variabile, e il tooltip da uno style inline.
export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const formatted = data.map(d => ({
    label: format(parseISO(d.month), 'MMM yy', { locale: it }),
    revenue: d.revenue,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: 16, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={SERIE} stopOpacity={0.25} />
            <stop offset="95%" stopColor={SERIE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid className="stroke-border" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, className: 'fill-muted-foreground' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
          tick={{ fontSize: 11, className: 'fill-muted-foreground' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: SERIE, strokeOpacity: 0.3 }}
          contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: 12,
            color: 'var(--foreground)',
          }}
          formatter={(v) => [formatEur(Number(v ?? 0)), 'Incasso']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={SERIE}
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
