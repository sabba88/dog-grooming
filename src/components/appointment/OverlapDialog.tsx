'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface OverlapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  /** Orari liberi suggeriti dal server, se disponibili. */
  alternatives?: string[]
}

/**
 * Conferma richiesta quando l'appuntamento si sovrappone a un altro sulla stessa
 * persona o postazione. Non e' un blocco: gli appuntamenti in contemporanea sono
 * ammessi e nella griglia i blocchi si affiancano su corsie separate.
 */
export function OverlapDialog({
  open,
  onOpenChange,
  onConfirm,
  alternatives,
}: OverlapDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            C&apos;è già un appuntamento in questo orario. Vuoi procedere?
          </AlertDialogTitle>
          <AlertDialogDescription>
            I due appuntamenti verranno gestiti in parallelo e nell&apos;agenda appariranno
            affiancati.
            {alternatives && alternatives.length > 0
              ? ` Orari liberi vicini: ${alternatives.join(', ')}.`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Prenota in parallelo</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
