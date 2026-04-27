import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  delta?: {
    value: number
    format: 'percent' | 'absolute'
    label?: string
  }
  icon?: React.ReactNode
  highlight?: boolean
}

function DeltaBadge({ delta }: { delta: NonNullable<KpiCardProps['delta']> }) {
  const isPositive = delta.value > 0
  const isNeutral = delta.value === 0

  const formatted =
    delta.format === 'percent'
      ? `${Math.abs(delta.value).toFixed(0)}%`
      : `${Math.abs(delta.value)}`

  const label = delta.label ?? 'vs mese prec.'

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        {formatted} {label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : '-'}{formatted} {label}
    </span>
  )
}

export function KpiCard({ label, value, delta, icon, highlight }: KpiCardProps) {
  return (
    <div
      className={`rounded-lg border p-5 flex flex-col gap-3 ${
        highlight
          ? 'border-brand-primary bg-brand-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
      {delta && <DeltaBadge delta={delta} />}
    </div>
  )
}
