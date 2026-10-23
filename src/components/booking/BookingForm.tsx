'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createBooking, updateBooking } from '@/lib/actions/bookings'
import { fetchDogsForClient, fetchAllServices, fetchAppointmentPrice } from '@/lib/actions/appointments'
import { BOOKING_DURATION_PRESETS, DEFAULT_BOOKING_DURATION } from '@/lib/validations/bookings'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import { ClientDogSearch } from '@/components/appointment/ClientDogSearch'
import { QuickClientForm } from '@/components/appointment/QuickClientForm'
import { QuickDogForm } from '@/components/appointment/QuickDogForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Calendar, ChevronDown, ChevronUp, Clock, Loader2, X } from 'lucide-react'

interface Dog {
  id: string
  name: string
  breedName: string | null
  coatType: string | null
  sizeType: string | null
  breedCoatType: string | null
  breedSizeType: string | null
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

export interface BookingInitialValues {
  id: string
  clientId: string
  clientNominativo: string
  dogId: string
  duration: number
  serviceId: string | null
  price: number | null
  notes: string | null
}

interface BookingFormProps {
  locationId: string
  date: string
  time: string
  mode?: 'create' | 'edit'
  initialValues?: BookingInitialValues
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Il form della prenotazione: cliente, cane, durata. Tutto il resto sta sotto
 * "Dettagli", chiuso di default — chi prenota al telefono non deve aprirlo.
 */
export function BookingForm({
  locationId,
  date,
  time,
  mode = 'create',
  initialValues,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const [selectedClient, setSelectedClient] = useState<{ id: string; nominativo: string } | null>(
    initialValues ? { id: initialValues.clientId, nominativo: initialValues.clientNominativo } : null
  )
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDogId, setSelectedDogId] = useState<string | null>(initialValues?.dogId ?? null)
  const [duration, setDuration] = useState<number>(initialValues?.duration ?? DEFAULT_BOOKING_DURATION)
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [showQuickDog, setShowQuickDog] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialValues?.serviceId ?? null)
  const [priceEur, setPriceEur] = useState<string>(
    initialValues?.price != null ? String(Math.round(initialValues.price / 100)) : ''
  )
  const [notes, setNotes] = useState<string>(initialValues?.notes ?? '')

  const { execute: loadDogs, isPending: isLoadingDogs } = useAction(fetchDogsForClient, {
    onSuccess: ({ data }) => {
      if (!data?.dogs) return
      setDogs(data.dogs)
      // Un cliente con un solo cane non merita una domanda.
      if (data.dogs.length === 1 && !selectedDogId) setSelectedDogId(data.dogs[0].id)
    },
  })

  const { execute: loadServices, isPending: isLoadingServices } = useAction(fetchAllServices, {
    onSuccess: ({ data }) => {
      if (data?.services) setServices(data.services)
    },
  })

  const { execute: fetchPrice } = useAction(fetchAppointmentPrice, {
    onSuccess: ({ data }) => {
      if (data?.basePrice != null) setPriceEur(String(Math.round(data.basePrice / 100)))
    },
  })

  const { execute: submitCreate, isPending: isCreating } = useAction(createBooking, {
    onSuccess: () => {
      toast.success('Prenotazione salvata')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante il salvataggio')
    },
  })

  const { execute: submitUpdate, isPending: isUpdating } = useAction(updateBooking, {
    onSuccess: () => {
      toast.success('Prenotazione aggiornata')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante il salvataggio')
    },
  })

  // In modifica il cliente e' gia' noto: restano da caricare i suoi cani.
  // Deve stare in un effect: `loadDogs` apre una transition, e aprirla durante
  // il render fa esplodere React ("Cannot call startTransition while rendering").
  useEffect(() => {
    if (initialValues) loadDogs({ clientId: initialValues.clientId })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSelect({
    client,
    dog,
  }: {
    client: { id: string; nominativo: string }
    dog: { id: string; name: string } | null
  }) {
    setSelectedClient(client)
    setSelectedDogId(dog?.id ?? null)
    setDogs([])
    setShowQuickDog(false)
    loadDogs({ clientId: client.id })
  }

  function handleClearClient() {
    setSelectedClient(null)
    setSelectedDogId(null)
    setDogs([])
    setSelectedServiceId(null)
    setPriceEur('')
  }

  function handleOpenDetails() {
    const next = !detailsOpen
    setDetailsOpen(next)
    if (next && services.length === 0) loadServices({})
  }

  function handleServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId)
    const service = services.find((s) => s.id === serviceId)
    if (!service) return
    // Il servizio sa quanto dura: la durata scelta a mano resta se e' diversa dal default.
    if (duration === DEFAULT_BOOKING_DURATION) setDuration(service.duration)

    const dog = dogs.find((d) => d.id === selectedDogId)
    const coat = dog?.coatType ?? dog?.breedCoatType ?? null
    const size = dog?.sizeType ?? dog?.breedSizeType ?? null
    if (coat && size) {
      fetchPrice({ serviceId, coatType: coat, sizeType: size })
    } else {
      setPriceEur(String(Math.round(service.price / 100)))
    }
  }

  function handleSubmit() {
    if (!selectedClient || !selectedDogId) return

    const priceCents = priceEur.trim() === '' ? undefined : Math.round(parseFloat(priceEur) * 100)
    const common = {
      duration,
      clientId: selectedClient.id,
      dogId: selectedDogId,
      ...(selectedServiceId && { serviceId: selectedServiceId }),
      ...(priceCents != null && !Number.isNaN(priceCents) && { price: priceCents }),
      ...(notes.trim() && { notes: notes.trim() }),
    }

    if (mode === 'edit' && initialValues) {
      submitUpdate({ id: initialValues.id, date, time, ...common })
      return
    }
    submitCreate({ locationId, date, time, ...common })
  }

  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(date + 'T00:00:00.000Z'))

  const isSaving = isCreating || isUpdating
  const canSave = !!selectedClient && !!selectedDogId && duration >= 15

  return (
    <div className="flex flex-col gap-4">
      {/* Giorno e ora: arrivano dalla cella cliccata, non si ridigitano */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          <span className="font-medium">{time}</span>
        </div>
      </div>

      {/* Cliente e cane */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium">Cliente</Label>
        {showQuickClient ? (
          <QuickClientForm
            onCreated={(client) => {
              setShowQuickClient(false)
              handleSearchSelect({ client, dog: null })
            }}
            onCancel={() => setShowQuickClient(false)}
          />
        ) : selectedClient ? (
          <div className="flex items-center gap-3 rounded-lg border p-2.5">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                {selectedClient.nominativo.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium">{selectedClient.nominativo}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={handleClearClient}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <ClientDogSearch onSelect={handleSearchSelect} onCreateNew={() => setShowQuickClient(true)} />
        )}
      </div>

      {selectedClient && (
        <div>
          <Label className="mb-1.5 block text-sm font-medium">Cane</Label>
          {isLoadingDogs ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Caricamento...
            </div>
          ) : showQuickDog ? (
            <QuickDogForm
              clientId={selectedClient.id}
              onCreated={(dog) => {
                setShowQuickDog(false)
                setSelectedDogId(dog.id)
                loadDogs({ clientId: selectedClient.id })
              }}
              onCancel={() => setShowQuickDog(false)}
            />
          ) : dogs.length === 0 ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Nessun cane associato</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowQuickDog(true)}>
                + Aggiungi cane
              </Button>
            </div>
          ) : (
            <Select value={selectedDogId ?? undefined} onValueChange={setSelectedDogId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona cane" />
              </SelectTrigger>
              <SelectContent>
                {dogs.map((dog) => (
                  <SelectItem key={dog.id} value={dog.id}>
                    {dog.name}
                    {dog.breedName ? ` (${dog.breedName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Durata: tre bottoni coprono quasi tutti i casi, il resto a mano */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium">Durata</Label>
        <div className="flex flex-wrap items-center gap-2">
          {BOOKING_DURATION_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={duration === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDuration(preset)}
            >
              {formatDuration(preset)}
            </Button>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className={cn(
                'w-20',
                !BOOKING_DURATION_PRESETS.includes(duration as 60 | 90 | 120) && 'border-primary'
              )}
              aria-label="Durata personalizzata in minuti"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        </div>
      </div>

      {/* Dettagli: chiusi di default, si completano in pianificazione */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          onClick={handleOpenDetails}
        >
          {detailsOpen ? <ChevronUp className="mr-1 size-4" /> : <ChevronDown className="mr-1 size-4" />}
          Dettagli (facoltativi)
        </Button>

        {detailsOpen && (
          <div className="mt-2 flex flex-col gap-3 rounded-lg border p-3">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Servizio</Label>
              {isLoadingServices ? (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Caricamento servizi...
                </div>
              ) : (
                <Select value={selectedServiceId ?? undefined} onValueChange={handleServiceChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Da decidere in pianificazione" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} — {formatPrice(service.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="bf-price" className="mb-1.5 block text-sm font-medium">
                Prezzo (EUR)
              </Label>
              <Input
                id="bf-price"
                type="number"
                min={0}
                step="1"
                value={priceEur}
                onChange={(e) => setPriceEur(e.target.value)}
                placeholder="Da definire"
              />
            </div>

            <div>
              <Label htmlFor="bf-notes" className="mb-1.5 block text-sm font-medium">
                Note
              </Label>
              <Textarea
                id="bf-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indicazioni del cliente..."
                rows={2}
                maxLength={2000}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Annulla
        </Button>
        <Button
          type="button"
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={!canSave || isSaving}
          onClick={handleSubmit}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Salvataggio...
            </>
          ) : mode === 'edit' ? (
            'Salva'
          ) : (
            'Prenota'
          )}
        </Button>
      </div>
    </div>
  )
}
