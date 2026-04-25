'use client'

interface EmptySlotProps {
  userId: string
  userName: string
  date: string
  time: string
  variant: 'grid' | 'timeline'
  style?: React.CSSProperties
  onClick?: (data: { userId: string; userName: string; date: string; time: string }) => void
  isMovingTarget?: boolean
}

export function EmptySlot({
  userId,
  userName,
  date,
  time,
  variant,
  style,
  onClick,
  isMovingTarget,
}: EmptySlotProps) {
  if (variant === 'grid') {
    return (
      <button
        onClick={() => onClick?.({ userId, userName, date, time })}
        className="absolute inset-x-0 cursor-pointer transition-colors hover:border-primary hover:border rounded-sm"
        style={{
          ...style,
          background: isMovingTarget
            ? '#F0FDF4'
            : `repeating-linear-gradient(
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
      onClick={() => onClick?.({ userId, userName, date, time })}
      className="w-full rounded-lg p-3 text-left cursor-pointer transition-colors hover:border-primary min-h-11"
      style={{
        border: isMovingTarget ? '2px dashed #86EFAC' : '2px dashed #E2E8F0',
        backgroundColor: isMovingTarget ? '#F0FDF4' : undefined,
      }}
    >
      <span className="text-sm text-muted-foreground">
        {isMovingTarget ? 'Sposta qui' : '+ Slot libero'}
      </span>
    </button>
  )
}
