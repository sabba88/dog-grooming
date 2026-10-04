'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { formatPrice, formatCoOwnerNames, formatCoOwnerFull, type CoOwner } from '@/lib/utils/formatting'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ContextAction = 'detail' | 'add-note' | 'move' | 'delete'

interface AppointmentBlockProps {
  id: string
  clientName: string
  coOwners: CoOwner[]
  dogName: string
  breedName: string | null
  serviceName: string
  staffName: string
  price: number
  startTime: Date
  endTime: Date
  color: { bg: string; border: string }
  variant: 'grid' | 'timeline'
  style?: React.CSSProperties
  onClick?: (id: string) => void
  isMoving?: boolean
  onContextAction?: (action: ContextAction, id: string) => void
}

export function AppointmentBlock({
  id,
  clientName,
  coOwners,
  dogName,
  breedName,
  serviceName,
  staffName,
  price,
  startTime,
  endTime,
  color,
  variant,
  style,
  onClick,
  isMoving,
  onContextAction,
}: AppointmentBlockProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const formatTime = (date: Date) => {
    const h = String(date.getUTCHours()).padStart(2, '0')
    const m = String(date.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  // Nella griglia lo spazio verticale e' minimo: i co-proprietari si accodano alla
  // riga cliente invece di occupare una riga propria. Il title recupera cio' che viene troncato.
  const coOwnerNames = coOwners.length > 0 ? formatCoOwnerNames(coOwners) : ''
  const ownersTitle =
    coOwners.length > 0 ? `${clientName} · ${formatCoOwnerFull(coOwners)}` : clientName

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onContextAction || isMoving) return
    e.preventDefault()
    e.stopPropagation()
    setDropdownOpen(true)
  }

  const handleTouchStart = () => {
    if (!onContextAction || isMoving) return
    longPressTimerRef.current = setTimeout(() => setDropdownOpen(true), 500)
  }

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const dropdownContent = (
    <DropdownMenuContent align="start">
      <DropdownMenuItem onSelect={() => onContextAction?.('detail', id)}>
        Dettaglio
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onContextAction?.('add-note', id)}>
        Aggiungi Nota
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => onContextAction?.('move', id)}>
        Sposta
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => onContextAction?.('delete', id)}
        className="text-destructive focus:text-destructive"
      >
        Cancella
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  if (variant === 'grid') {
    return (
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            onClick={() => { if (!dropdownOpen) onClick?.(id) }}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            title={ownersTitle}
            className={cn(
              "absolute inset-x-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden cursor-pointer transition-shadow hover:shadow-md z-10",
              isMoving && "opacity-40 pointer-events-none"
            )}
            style={{
              ...style,
              backgroundColor: color.bg,
              borderLeft: `4px solid ${color.border}`,
              minHeight: '44px',
            }}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium text-foreground truncate">
                {dogName}
                {breedName && <span className="font-normal text-muted-foreground"> ({breedName})</span>}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">{formatTime(startTime)}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {clientName}
              {coOwnerNames && <span> · {coOwnerNames}</span>}
            </p>
            <p className="text-xs text-muted-foreground truncate">{serviceName}</p>
            <p className="text-xs text-muted-foreground truncate">{staffName}</p>
          </button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    )
  }

  // timeline variant
  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={() => { if (!dropdownOpen) onClick?.(id) }}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          title={ownersTitle}
          className={cn(
            "w-full rounded-lg p-3 text-left cursor-pointer transition-shadow hover:shadow-md",
            isMoving && "opacity-40 pointer-events-none"
          )}
          style={{
            backgroundColor: color.bg,
            borderLeft: `4px solid ${color.border}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {dogName}
              {breedName && <span className="font-normal text-muted-foreground"> ({breedName})</span>}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{clientName}</p>
          {coOwners.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              + {formatCoOwnerFull(coOwners)}
            </p>
          )}
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{serviceName}</p>
            <span className="text-xs font-medium text-foreground">{formatPrice(price)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{staffName}</p>
        </button>
      </DropdownMenuTrigger>
      {dropdownContent}
    </DropdownMenu>
  )
}
