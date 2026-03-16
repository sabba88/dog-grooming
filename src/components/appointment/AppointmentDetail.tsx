'use client'

import { useState, useEffect } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { fetchAppointmentDetail, deleteAppointment } from '@/lib/actions/appointments'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
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
} from '@/components/ui/alert-dialog'
import { ArrowRightLeft, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentDetailProps {
  appointmentId: string
  onClose: () => void
  onMove: (appointmentId: string) => void
  onDeleted: () => void
}

export function AppointmentDetail({
  appointmentId,
  onClose,
  onMove,
  onDeleted,
}: AppointmentDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { execute: loadDetail, result: detailResult, isExecuting: isLoading } = useAction(fetchAppointmentDetail)
  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Appuntamento cancellato')
      onDeleted()
    },
    onError: () => {
      toast.error('Errore durante la cancellazione')
    },
  })

  useEffect(() => {
    loadDetail({ id: appointmentId })
  }, [appointmentId])

  const appointment = detailResult?.data?.appointment

  if (isLoading || !appointment) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const startTime = new Date(appointment.startTime)
  const endTime = new Date(appointment.endTime)
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (60 * 1000)

  const formatTime = (date: Date) => {
    const h = String(date.getUTCHours()).padStart(2, '0')
    const m = String(date.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const clientName = `${appointment.clientFirstName} ${appointment.clientLastName}`

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-20">Cliente</span>
          <span className="text-sm font-medium">{clientName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-20">Cane</span>
          <span className="text-sm font-medium">{appointment.dogName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-20">Servizio</span>
          <span className="text-sm font-medium">{appointment.serviceName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-20">Persona</span>
          <span className="text-sm font-medium">{appointment.userName}</span>
        </div>

        <div className="border-t pt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Data</span>
            <span className="text-sm font-medium">
              {format(startTime, "EEE d MMM yyyy", { locale: it })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Orario</span>
            <span className="text-sm font-medium">
              {formatTime(startTime)} - {formatTime(endTime)} ({formatDuration(durationMinutes)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Prezzo</span>
            <span className="text-sm font-medium">{formatPrice(appointment.price)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onMove(appointmentId)}
        >
          <ArrowRightLeft className="size-4 mr-2" />
          Sposta
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="size-4 mr-2" />
          Cancella
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare l&apos;appuntamento?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;appuntamento di {clientName} ({appointment.dogName}) verra&apos; cancellato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeDelete({ id: appointmentId })}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Cancella
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
