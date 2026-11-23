'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { formatPriceOrDash, formatServiceName, formatCoOwnerNames, formatCoOwnerFull, type CoOwner } from '@/lib/utils/formatting'
import { DA_PIANIFICARE_LABEL } from '@/lib/utils/appointment'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check } from 'lucide-react'

type ContextAction = 'detail' | 'add-note' | 'move' | 'delete'

interface AppointmentBlockProps {
  id: string
  clientName: string
  coOwners: CoOwner[]
  dogName: string
  breedName: string | null
  serviceName: string | null
  staffName: string
  /**
   * Postazione dell'appuntamento, usata solo in vista persone: li' la colonna e'
   * gia' il collaboratore, quindi al suo posto si mostra dove lavora.
   * Non passata (vista postazioni) la riga continua a mostrare il collaboratore.
   */
  stationName?: string | null
  showStation?: boolean
  price: number | null
  /** Manca postazione, collaboratore o servizio: il blocco si segnala a vista. */
  daPianificare?: boolean
  /** Prestazione conclusa e prezzo confermato: il blocco porta la spunta. */
  closed?: boolean
  startTime: Date
  endTime: Date
  /** Riempimento: dice di chi e' il lavoro. */
  fill: string
  /** Spina da 4px a sinistra: dice che servizio e'. */
  spine: string
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
  stationName,
  showStation,
  price,
  daPianificare,
  closed,
  startTime,
  endTime,
  fill,
  spine,
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
        Aggiungi nota
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
            title={closed ? `${ownersTitle} · chiuso` : ownersTitle}
            className={cn(
              // Il passaggio del mouse accende un filo attorno al blocco: in una griglia
              // fitta un'ombra che solleva fa ballare tutto quello che le sta intorno.
              "absolute inset-x-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden cursor-pointer z-10",
              "ring-1 ring-transparent transition-shadow hover:ring-foreground/25",
              daPianificare && "border border-dashed border-muted-foreground/50",
              isMoving && "opacity-40 pointer-events-none"
            )}
            style={{
              ...style,
              backgroundColor: fill,
              borderLeft: `4px solid ${spine}`,
              minHeight: '44px',
            }}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium text-foreground truncate">
                {dogName}
                {breedName && <span className="font-normal text-muted-foreground"> ({breedName})</span>}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {closed && <Check className="mr-0.5 inline size-3 text-brand-success" />}
                {formatTime(startTime)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {clientName}
              {coOwnerNames && <span> · {coOwnerNames}</span>}
            </p>
            <p className="text-xs truncate text-muted-foreground">
              {formatServiceName(serviceName)}
            </p>
            <p className="text-xs truncate text-muted-foreground">
              {showStation
                ? (stationName ?? 'Postazione da assegnare')
                : (daPianificare ? DA_PIANIFICARE_LABEL : staffName)}
            </p>
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
            "w-full rounded-lg p-3 text-left cursor-pointer",
            "ring-1 ring-transparent transition-shadow hover:ring-foreground/25",
            daPianificare && "border border-dashed border-muted-foreground/50",
            isMoving && "opacity-40 pointer-events-none"
          )}
          style={{
            backgroundColor: fill,
            borderLeft: `4px solid ${spine}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {dogName}
              {breedName && <span className="font-normal text-muted-foreground"> ({breedName})</span>}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {closed && <Check className="mr-0.5 inline size-3 text-brand-success" />}
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
            <p className="text-xs text-muted-foreground">
              {formatServiceName(serviceName)}
            </p>
            <span className="text-xs font-medium text-foreground">{formatPriceOrDash(price)}</span>
          </div>
          <p className="text-xs mt-0.5 text-muted-foreground">
            {showStation
              ? (stationName ?? 'Postazione da assegnare')
              : (daPianificare ? DA_PIANIFICARE_LABEL : staffName)}
          </p>
        </button>
      </DropdownMenuTrigger>
      {dropdownContent}
    </DropdownMenu>
  )
}
