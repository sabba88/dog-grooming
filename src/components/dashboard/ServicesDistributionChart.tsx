'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ServicesDistributionChartProps {
  data: { name: string; count: number; revenue: number }[]
}

const COLORS = ['#4BBFC8', '#E05C6B', '#347D85', '#E5F7F9', '#94C9CD']

function formatEur(cents: number) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function ServicesDistributionChart({ data }: ServicesDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        Nessun appuntamento questo mese
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          formatter={(v, name, props) => [
            `${v ?? 0} appt — ${formatEur(Number((props as { payload?: { revenue?: number } })?.payload?.revenue ?? 0))}`,
            name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
