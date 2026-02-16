'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { deleteAppointment } from '@/lib/actions/appointments'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
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

interface AppointmentDetailProps {
  appointment: {
    id: string
    clientFirstName: string
    clientLastName: string
    dogName: string
    serviceName: string
    serviceId: string
    startTime: Date
    endTime: Date
    price: number
    stationId: string
    notes: string | null
  }
  stationName: string
  onClose: () => void
  onDelete: () => void
  onReschedule: () => void
}

export function AppointmentDetail({
  appointment,
  stationName,
  onClose,
  onDelete,
  onReschedule,
}: AppointmentDetailProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const { execute: executeDelete, isPending } = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Appuntamento cancellato')
      onDelete()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Errore durante la cancellazione')
    },
  })

  const clientName = `${appointment.clientFirstName} ${appointment.clientLastName}`
  const durationMinutes = Math.round(
    (appointment.endTime.getTime() - appointment.startTime.getTime()) / 60000
  )

  const formatTime = (date: Date) => {
    const h = String(date.getUTCHours()).padStart(2, '0')
    const m = String(date.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)
  }

  const handleConfirmDelete = () => {
    executeDelete({ appointmentId: appointment.id })
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>📍</span>
          <span>{stationName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>📅</span>
          <span className="capitalize">{formatDate(appointment.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>🕐</span>
          <span>
            {formatTime(appointment.startTime)} — {formatTime(appointment.endTime)} ({formatDuration(durationMinutes)})
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>✂️</span>
          <span>{appointment.serviceName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>💰</span>
          <span>{formatPrice(appointment.price)}</span>
        </div>
        {appointment.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <span>📝</span>
            <span>{appointment.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1 min-h-[44px]"
          onClick={onReschedule}
        >
          Sposta
        </Button>
        <Button
          variant="destructive"
          className="flex-1 min-h-[44px]"
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
        >
          Cancella
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellare l&apos;appuntamento?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;appuntamento di {clientName} ({appointment.dogName}) verra&apos; cancellato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? 'Cancellazione...' : 'Cancella'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
