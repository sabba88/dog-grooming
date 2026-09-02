'use client'

interface EmptySlotData {
  stationId?: string
  stationName?: string
  userId?: string
  userName?: string
  date: string
  time: string
}

interface EmptySlotProps {
  stationId?: string
  stationName?: string
  userId?: string
  userName?: string
  date: string
  time: string
  variant: 'grid' | 'timeline'
  closed?: boolean
  style?: React.CSSProperties
  onClick?: (data: EmptySlotData) => void
  isMovingTarget?: boolean
}

export function EmptySlot({
  stationId,
  stationName,
  userId,
  userName,
  date,
  time,
  variant,
  closed,
  style,
  onClick,
  isMovingTarget,
}: EmptySlotProps) {
  if (variant === 'grid') {
    let bg = 'white'
    if (isMovingTarget) bg = '#F0FDF4'
    else if (closed) bg = '#E5E7EB'
    return (
      <button
        onClick={() => onClick?.({ stationId, stationName, userId, userName, date, time })}
        className="absolute inset-x-0 cursor-pointer transition-colors border border-border/40 hover:border-primary hover:bg-primary/5 flex items-start"
        style={{ ...style, background: bg }}
      >
        <span className="text-xs text-muted-foreground/70 leading-none px-0.5 pt-0.5">
          {time}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick?.({ stationId, stationName, userId, userName, date, time })}
      className="w-full rounded-lg p-3 text-left cursor-pointer transition-colors hover:border-primary min-h-11"
      style={{
        border: isMovingTarget ? '2px dashed #86EFAC' : '2px dashed #E2E8F0',
        backgroundColor: isMovingTarget ? '#F0FDF4' : closed ? '#E5E7EB' : undefined,
      }}
    >
      <span className="text-sm text-muted-foreground">
        {isMovingTarget ? 'Sposta qui' : `${time} · + Slot libero`}
      </span>
    </button>
  )
}
