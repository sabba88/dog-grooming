'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
import { applyTemplateToWeek } from '@/lib/actions/staff'
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

interface ApplyTemplateButtonProps {
  weekStart: string
  hasTemplates: boolean
}

export function ApplyTemplateButton({ weekStart, hasTemplates }: ApplyTemplateButtonProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { execute, isPending } = useAction(applyTemplateToWeek, {
    onSuccess: ({ data }) => {
      setDialogOpen(false)
      if (data && data.generated > 0) {
        toast.success(`${data.generated} turni generati dal template`)
        router.refresh()
      } else {
        toast.info('Tutti i turni del template erano già presenti')
      }
    },
    onError: ({ error }) => {
      setDialogOpen(false)
      toast.error(error.serverError ?? 'Errore durante applicazione template')
    },
  })

  if (!hasTemplates) return null

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <CalendarCheck className="size-3.5" />
          Applica template a settimana
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Applica template a settimana?</AlertDialogTitle>
          <AlertDialogDescription>
            Verranno generati i turni standard per tutti i dipendenti. I turni già presenti non saranno sovrascritti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => execute({ weekStart })}
            disabled={isPending}
          >
            {isPending ? 'Applicazione in corso...' : 'Applica template'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
