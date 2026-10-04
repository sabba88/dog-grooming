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

interface ExceedsShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  shiftEndTime?: string
}

/** Conferma richiesta quando l'appuntamento termina dopo la fine del turno del collaboratore. */
export function ExceedsShiftDialog({
  open,
  onOpenChange,
  onConfirm,
  shiftEndTime,
}: ExceedsShiftDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>L&apos;appuntamento supera la fine del turno. Vuoi procedere?</AlertDialogTitle>
          <AlertDialogDescription>
            {shiftEndTime
              ? `Il turno termina alle ${shiftEndTime}. L'appuntamento verrà salvato comunque.`
              : "L'appuntamento verrà salvato comunque, oltre la fine del turno."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continua</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
