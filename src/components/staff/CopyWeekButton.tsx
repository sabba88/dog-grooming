'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { copyWeekShifts } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface CopyWeekButtonProps {
  weekStart: string
  hasShifts: boolean
}

export function CopyWeekButton({ weekStart, hasShifts }: CopyWeekButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  const sourceWeekStart = format(subDays(parseISO(weekStart), 7), 'yyyy-MM-dd')
  const sourceWeekEnd = format(addDays(parseISO(sourceWeekStart), 6), 'yyyy-MM-dd')

  const { execute, isPending } = useAction(copyWeekShifts, {
    onSuccess: ({ data }) => {
      setDialogOpen(false)
      if (data && data.copied > 0) {
        toast.success(`${data.copied} turni copiati dalla settimana precedente`)
        router.refresh()
      } else {
        toast.info('Nessun turno da copiare o tutti già presenti')
      }
    },
    onError: ({ error }) => {
      setDialogOpen(false)
      toast.error(error.serverError ?? 'Errore durante la copia')
    },
  })

  const sourceLabel = `${format(parseISO(sourceWeekStart), 'd MMM', { locale: it })} – ${format(parseISO(sourceWeekEnd), 'd MMM', { locale: it })}`

  if (hasShifts) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
        <Copy className="size-3.5" />
        Copia settimana prec.
      </Button>
    )
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Copy className="size-3.5" />
          Copia settimana prec.
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Copia settimana precedente?</AlertDialogTitle>
          <AlertDialogDescription>
            Verranno copiati i turni della settimana <strong>{sourceLabel}</strong> nella settimana corrente.
            I turni già presenti non verranno sovrascritti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => execute({ sourceWeekStart, targetWeekStart: weekStart })}
            disabled={isPending}
          >
            {isPending ? 'Copia in corso...' : 'Copia turni'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
