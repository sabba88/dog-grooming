'use client'

import { useState, useEffect } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createAppointment, fetchDogsForClient, fetchAllServices } from '@/lib/actions/appointments'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import { ClientSearch } from '@/components/appointment/ClientSearch'
import { QuickClientForm } from '@/components/appointment/QuickClientForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { User, Calendar, Clock, X, Loader2 } from 'lucide-react'

interface PrefilledSlot {
  userId: string
  userName: string
  date: string
  time: string
}

interface AppointmentFormProps {
  prefilledSlot: PrefilledSlot
  onSuccess: () => void
  onCancel: () => void
}

interface SelectedClient {
  id: string
  firstName: string
  lastName: string
}

interface Dog {
  id: string
  name: string
  breed: string | null
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

export function AppointmentForm({ prefilledSlot, onSuccess }: AppointmentFormProps) {
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [priceEur, setPriceEur] = useState<string>('')
  const [businessError, setBusinessError] = useState<{
    code: string
    message: string
    alternatives?: string[]
    closingTime?: string
  } | null>(null)

  const { execute: loadDogs, isPending: isLoadingDogs } = useAction(fetchDogsForClient, {
    onSuccess: ({ data }) => {
      if (data?.dogs) {
        setDogs(data.dogs)
        if (data.dogs.length === 1) {
          setSelectedDogId(data.dogs[0].id)
        }
      }
    },
  })

  const { execute: loadServices, isPending: isLoadingServices } = useAction(fetchAllServices, {
    onSuccess: ({ data }) => {
      if (data?.services) {
        setServices(data.services)
      }
    },
  })

  const { execute: submitAppointment, isPending: isSubmitting } = useAction(createAppointment, {
    onSuccess: ({ data }) => {
      if (data?.error) {
        setBusinessError(data.error)
        return
      }
      toast.success('Appuntamento salvato')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || 'Errore durante la creazione')
    },
  })

  // Load all services on mount
  useEffect(() => {
    loadServices({})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClientSelect = (client: SelectedClient) => {
    setSelectedClient(client)
    setSelectedDogId(null)
    setDogs([])
    setBusinessError(null)
    loadDogs({ clientId: client.id })
  }

  const handleClientCreated = (client: { id: string; firstName: string; lastName: string }) => {
    setShowQuickClient(false)
    handleClientSelect(client)
  }

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setBusinessError(null)
    const service = services.find((s) => s.id === serviceId)
    if (service) {
      setDuration(service.duration)
      setPriceEur((service.price / 100).toFixed(2))
    }
  }

  const handleAlternativeSlotClick = (time: string) => {
    setBusinessError(null)
    if (selectedClient && selectedDogId && selectedServiceId) {
      const priceCents = Math.round(parseFloat(priceEur) * 100)
      submitAppointment({
        userId: prefilledSlot.userId,
        date: prefilledSlot.date,
        time,
        clientId: selectedClient.id,
        dogId: selectedDogId,
        serviceId: selectedServiceId,
        duration,
        price: priceCents,
      })
    }
  }

  const handleSubmit = () => {
    if (!selectedClient || !selectedDogId || !selectedServiceId) return
    setBusinessError(null)
    const priceCents = Math.round(parseFloat(priceEur) * 100)
    submitAppointment({
      userId: prefilledSlot.userId,
      date: prefilledSlot.date,
      time: prefilledSlot.time,
      clientId: selectedClient.id,
      dogId: selectedDogId,
      serviceId: selectedServiceId,
      duration,
      price: priceCents,
    })
  }

  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(prefilledSlot.date + 'T00:00:00.000Z'))

  const isFormComplete = selectedClient && selectedDogId && selectedServiceId && duration >= 15 && parseFloat(priceEur) >= 0

  return (
    <div className="space-y-4">
      {/* Header: slot pre-compilato */}
      <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-sm">
          <User className="text-muted-foreground size-4" />
          <span className="font-medium">{prefilledSlot.userName}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="text-muted-foreground size-4" />
          <span className="capitalize">{formattedDate}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="text-muted-foreground size-4" />
          <span>{prefilledSlot.time}</span>
        </div>
      </div>

      {/* Sezione cliente */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium">Cliente</Label>
        {selectedClient ? (
          <div className="flex items-center gap-3 rounded-lg border p-2.5">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                {selectedClient.firstName[0]}{selectedClient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium">
              {selectedClient.firstName} {selectedClient.lastName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={() => {
                setSelectedClient(null)
                setSelectedDogId(null)
                setDogs([])
                setSelectedServiceId(null)
                setDuration(0)
                setPriceEur('')
                setBusinessError(null)
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <ClientSearch
            onSelect={handleClientSelect}
            onCreateNew={() => setShowQuickClient(true)}
          />
        )}
      </div>

      {/* Sezione cane — mostrata solo dopo selezione cliente */}
      {selectedClient && (
        <div>
          <Label className="mb-1.5 block text-sm font-medium">Cane</Label>
          {isLoadingDogs ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Caricamento...
            </div>
          ) : dogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun cane associato a questo cliente</p>
          ) : dogs.length === 1 ? (
            <div className="rounded-lg border p-2.5 text-sm">
              <span className="font-medium">{dogs[0].name}</span>
              {dogs[0].breed && <span className="text-muted-foreground ml-1">({dogs[0].breed})</span>}
            </div>
          ) : (
            <Select value={selectedDogId ?? undefined} onValueChange={(val) => { setSelectedDogId(val); setBusinessError(null) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona cane" />
              </SelectTrigger>
              <SelectContent>
                {dogs.map((dog) => (
                  <SelectItem key={dog.id} value={dog.id}>
                    {dog.name}{dog.breed ? ` (${dog.breed})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Sezione servizio — mostrata solo dopo selezione cane */}
      {selectedDogId && (
        <div>
          <Label className="mb-1.5 block text-sm font-medium">Servizio</Label>
          {isLoadingServices ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Caricamento servizi...
            </div>
          ) : services.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun servizio disponibile</p>
          ) : (
            <Select value={selectedServiceId ?? undefined} onValueChange={handleServiceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona servizio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} — {formatPrice(service.price)} ({formatDuration(service.duration)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Durata e prezzo — mostrati solo dopo selezione servizio */}
      {selectedServiceId && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="af-duration" className="mb-1.5 block text-sm font-medium">Durata (min)</Label>
            <Input
              id="af-duration"
              type="number"
              min={15}
              value={duration}
              onChange={(e) => {
                setDuration(parseInt(e.target.value) || 0)
                setBusinessError(null)
              }}
            />
          </div>
          <div>
            <Label htmlFor="af-price" className="mb-1.5 block text-sm font-medium">Prezzo (EUR)</Label>
            <Input
              id="af-price"
              type="number"
              min={0}
              step="0.01"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Errori business */}
      {businessError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-destructive text-sm font-medium">{businessError.message}</p>
          {businessError.code === 'SLOT_OCCUPIED' && businessError.alternatives && businessError.alternatives.length > 0 && (
            <div className="mt-2">
              <p className="text-muted-foreground mb-1.5 text-xs">Slot alternativi disponibili:</p>
              <div className="flex flex-wrap gap-1.5">
                {businessError.alternatives.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlternativeSlotClick(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {businessError.code === 'EXCEEDS_CLOSING_TIME' && businessError.closingTime && (
            <p className="text-muted-foreground mt-1 text-xs">
              Chiusura alle {businessError.closingTime}. Riduci la durata per procedere.
            </p>
          )}
        </div>
      )}

      {/* Bottone conferma */}
      {selectedServiceId && (
        <Button
          type="button"
          className="w-full"
          disabled={!isFormComplete || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            'Conferma'
          )}
        </Button>
      )}

      {/* Quick Client Form (Dialog secondario) */}
      <QuickClientForm
        open={showQuickClient}
        onOpenChange={setShowQuickClient}
        onCreated={handleClientCreated}
      />
    </div>
  )
}
