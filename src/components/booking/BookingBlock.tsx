'use client'

import { cn } from '@/lib/utils'
import { formatCoOwnerNames, formatCoOwnerFull, type CoOwner } from '@/lib/utils/formatting'
import { DA_PIANIFICARE_LABEL } from '@/lib/utils/appointment'
import { PhoneBadge } from '@/components/appointment/PhoneBadge'

interface BookingBlockProps {
  id: string
  clientName: string
  coOwners: CoOwner[]
  dogName: string
  breedName: string | null
  serviceName: string | null
  startTime: Date
  endTime: Date
  /** Nessuno ci ha ancora messo mano in pianificazione. */
  daPianificare: boolean
  /** Preso o spostato dall'assistente vocale: icona del telefono accanto al cane. */
  phoneLabel?: string | null
  style?: React.CSSProperties
  onClick?: (id: string) => void
}

function formatTime(date: Date) {
  const h = String(date.getUTCHours()).padStart(2, '0')
  const m = String(date.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Il blocco del calendario di prenotazione: chi viene, con quale cane, a che ora.
 * Niente postazione, collaboratore o prezzo — in questa fase non esistono ancora.
 */
export function BookingBlock({
  id,
  clientName,
  coOwners,
  dogName,
  breedName,
  serviceName,
  startTime,
  endTime,
  daPianificare,
  phoneLabel,
  style,
  onClick,
}: BookingBlockProps) {
  const coOwnerNames = coOwners.length > 0 ? formatCoOwnerNames(coOwners) : ''
  const title =
    coOwners.length > 0 ? `${clientName} · ${formatCoOwnerFull(coOwners)}` : clientName

  return (
    <button
      onClick={() => onClick?.(id)}
      title={title}
      className={cn(
        'absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-1 text-left z-10',
        'ring-1 ring-transparent transition-shadow hover:ring-foreground/25',
        // Solida la prenotazione a posto, tratteggiata quella ancora da pianificare:
        // stesso linguaggio dei blocchi in agenda.
        daPianificare
          ? 'border border-dashed border-muted-foreground/50 bg-muted'
          : 'border border-border bg-accent'
      )}
      style={{ ...style, minHeight: '44px' }}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="flex min-w-0 items-center gap-1 truncate text-xs font-medium text-foreground">
          {phoneLabel && <PhoneBadge label={phoneLabel} compact />}
          {dogName}
          {breedName && <span className="font-normal text-muted-foreground"> ({breedName})</span>}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatTime(startTime)}–{formatTime(endTime)}
        </span>
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {clientName}
        {coOwnerNames && <span> · {coOwnerNames}</span>}
      </p>
      <p
        className={cn(
          'truncate text-xs text-muted-foreground'
        )}
      >
        {serviceName ?? DA_PIANIFICARE_LABEL}
      </p>
    </button>
  )
}
