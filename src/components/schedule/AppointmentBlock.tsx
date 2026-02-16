'use client'

import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/formatting'

interface AppointmentBlockProps {
  id: string
  clientName: string
  dogName: string
  serviceName: string
  price: number
  startTime: Date
  endTime: Date
  color: { bg: string; border: string }
  variant: 'grid' | 'timeline'
  style?: React.CSSProperties
  onClick?: (id: string) => void
}

export function AppointmentBlock({
  id,
  clientName,
  dogName,
  serviceName,
  price,
  startTime,
  endTime,
  color,
  variant,
  style,
  onClick,
}: AppointmentBlockProps) {
  const formatTime = (date: Date) => {
    const h = String(date.getUTCHours()).padStart(2, '0')
    const m = String(date.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  if (variant === 'grid') {
    return (
      <button
        onClick={() => onClick?.(id)}
        className="absolute inset-x-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden cursor-pointer transition-shadow hover:shadow-md z-10"
        style={{
          ...style,
          backgroundColor: color.bg,
          borderLeft: `4px solid ${color.border}`,
          minHeight: '44px',
        }}
      >
        <p className="text-xs font-medium text-foreground truncate">{clientName}</p>
        <p className="text-xs text-muted-foreground truncate">{dogName}</p>
        <p className="text-xs text-muted-foreground truncate">{serviceName}</p>
      </button>
    )
  }

  // timeline variant
  return (
    <button
      onClick={() => onClick?.(id)}
      className="w-full rounded-lg p-3 text-left cursor-pointer transition-shadow hover:shadow-md"
      style={{
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{clientName}</p>
        <span className="text-xs text-muted-foreground">
          {formatTime(startTime)} - {formatTime(endTime)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{dogName}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">{serviceName}</p>
        <span className="text-xs font-medium text-foreground">{formatPrice(price)}</span>
      </div>
    </button>
  )
}
