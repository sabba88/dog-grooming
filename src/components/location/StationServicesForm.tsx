'use client'

import { useState } from 'react'
import { updateStationServices } from '@/lib/actions/stations'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface StationServicesFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  stationId: string
  stationName: string
  allServices: Service[]
  enabledServiceIds: string[]
}

export function StationServicesForm({
  open,
  onOpenChange,
  onSuccess,
  stationId,
  stationName,
  allServices,
  enabledServiceIds,
}: StationServicesFormProps) {
  const isMobile = useIsMobile()
  const [selectedIds, setSelectedIds] = useState<string[]>(enabledServiceIds)

  const { execute, isPending } = useAction(updateStationServices, {
    onSuccess: () => {
      toast.success('Servizi aggiornati')
      onOpenChange(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiornamento dei servizi")
    },
  })

  function handleToggle(serviceId: string, checked: boolean) {
    setSelectedIds(prev =>
      checked
        ? [...prev, serviceId]
        : prev.filter(id => id !== serviceId)
    )
  }

  function handleSubmit() {
    execute({ stationId, serviceIds: selectedIds })
  }

  const formContent = (
    <div className="flex flex-col gap-4">
      {allServices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun servizio disponibile nel listino.</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {allServices.map((service) => (
            <label
              key={service.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.includes(service.id)}
                onCheckedChange={(checked) => handleToggle(service.id, checked === true)}
                aria-label={`Abilita ${service.name}`}
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-foreground">{service.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDuration(service.duration)} · {formatPrice(service.price)}
                </span>
              </div>
            </label>
          ))}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={isPending} className="mt-2">
        {isPending ? 'Salvataggio...' : 'Salva Servizi'}
      </Button>
    </div>
  )

  const title = `Servizi — ${stationName}`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
