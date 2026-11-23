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
        <div className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Nessun servizio nel listino</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggiungi prima un servizio al listino, poi torna qui ad abilitarlo
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground tabular-nums">
            {selectedIds.length} di {allServices.length} servizi abilitati su questa postazione
          </p>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {allServices.map((service) => {
              const checked = selectedIds.includes(service.id)
              return (
                <label
                  key={service.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    checked ? 'border-primary/40 bg-accent' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => handleToggle(service.id, c === true)}
                    aria-label={`Abilita ${service.name}`}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground">{service.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDuration(service.duration)} · {formatPrice(service.price)}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </>
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
