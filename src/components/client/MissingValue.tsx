import { cn } from '@/lib/utils'

/**
 * Segnaposto per un dato di contatto mancante (nominativo o telefono).
 * La segnalazione e' solo visiva: la creazione del cliente resta consentita
 * previa conferma, vedi MissingContactDialog.
 */
export function MissingValue({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive',
        className
      )}
    >
      Mancante
    </span>
  )
}
