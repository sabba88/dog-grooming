'use client'

interface EmptySlotProps {
  stationId: string
  date: string
  time: string
  variant: 'grid' | 'timeline'
  style?: React.CSSProperties
  onClick?: (data: { stationId: string; date: string; time: string }) => void
}

export function EmptySlot({
  stationId,
  date,
  time,
  variant,
  style,
  onClick,
}: EmptySlotProps) {
  if (variant === 'grid') {
    return (
      <button
        onClick={() => onClick?.({ stationId, date, time })}
        className="absolute inset-x-0 cursor-pointer transition-colors hover:border-primary hover:border rounded-sm"
        style={{
          ...style,
          background: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            #F1F5F9 4px,
            #F1F5F9 5px
          )`,
          minHeight: '44px',
        }}
      />
    )
  }

  // timeline variant
  return (
    <button
      onClick={() => onClick?.({ stationId, date, time })}
      className="w-full rounded-lg p-3 text-left cursor-pointer transition-colors hover:border-primary min-h-11"
      style={{
        border: '2px dashed #E2E8F0',
      }}
    >
      <span className="text-sm text-muted-foreground">+ Slot libero</span>
    </button>
  )
}
