import { Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Segnala un appuntamento preso o spostato dall'assistente vocale.
 * `compact` mostra solo l'icona (blocchi del calendario), con il testo nel title.
 */
export function PhoneBadge({ label, compact, className }: { label: string; compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span title={label} aria-label={label} className={cn('inline-flex shrink-0 text-sky-700', className)}>
        <Phone className="size-3" />
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800',
        className
      )}
    >
      <Phone className="size-3" />
      {label}
    </span>
  )
}
