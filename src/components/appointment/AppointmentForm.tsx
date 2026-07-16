'use client'

import { useState, useEffect } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { createAppointment, fetchDogsForClient, fetchAllServices, fetchStationsForLocation, fetchServicesForStation, fetchAppointmentPrice } from '@/lib/actions/appointments'
import { formatPrice, formatDuration } from '@/lib/utils/formatting'
import { COAT_LABELS, SIZE_LABELS, CoatType, SizeType } from '@/lib/types'
import { ClientSearch } from '@/components/appointment/ClientSearch'
import { QuickClientForm } from '@/components/appointment/QuickClientForm'
import { QuickDogForm } from '@/components/appointment/QuickDogForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { User, Calendar, Clock, X, Loader2 } from 'lucide-react'

interface PrefilledSlot {
  stationId?: string | null
  stationName?: string | null
  userId?: string
  userName?: string
  date: string
  time: string
  locationId: string
}

interface AppointmentFormProps {
  prefilledSlot: PrefilledSlot
  availableStaff?: { id: string; name: string }[]
  onSuccess: () => void
  onCancel: () => void
}

interface SelectedClient {
  id: string
  nominativo: string
}

interface Dog {
  id: string
  name: string
  breedId: string | null
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
  durationSurchargePer30min: number
}

type PriceHintState = { coat: string | null; size: string | null } | 'base' | null

function getEffectiveCoatSize(dog: Dog) {
  const coat = dog.coatType ?? dog.breedCoatType ?? null
  const size = dog.sizeType ?? dog.breedSizeType ?? null
  return { coat, size }
}

export function AppointmentForm({ prefilledSlot, availableStaff, onSuccess }: AppointmentFormProps) {
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [showQuickDog, setShowQuickDog] = useState(false)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>(prefilledSlot.userId ?? '')
  const [stationsList, setStationsList] = useState<{ id: string; name: string }[]>([])
  const [selectedStationId, setSelectedStationId] = useState<string | null>(prefilledSlot.stationId ?? null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [priceEur, setPriceEur] = useState<string>('')
  const [basePriceForMatrix, setBasePriceForMatrix] = useState<number | null>(null)
  const [priceIsManual, setPriceIsManual] = useState<boolean>(false)
  const [priceHint, setPriceHint] = useState<PriceHintState>(null)
  const [businessError, setBusinessError] = useState<{
    code: string
    message: string
    alternatives?: string[]
    alternativeStaff?: { id: string; name: string }[]
    shiftEndTime?: string
  } | null>(null)

  function recalcPriceWithSurcharge(baseMatrixPrice: number, currentServiceId: string | null, currentDuration: number, isManual: boolean) {
    if (isManual) return
    const service = services.find(s => s.id === currentServiceId)
    if (!service) return
    const extraMinutes = Math.max(0, currentDuration - service.duration)
    const surchargeUnits = Math.floor(extraMinutes / 30)
    const totalPrice = baseMatrixPrice + surchargeUnits * service.durationSurchargePer30min
    setPriceEur(String(Math.round(totalPrice / 100)))
  }

  const { execute: executeFetchPrice } = useAction(fetchAppointmentPrice, {
    onSuccess: ({ data }) => {
      if (data?.basePrice != null) {
        setBasePriceForMatrix(data.basePrice)
        recalcPriceWithSurcharge(data.basePrice, selectedServiceId, duration, priceIsManual)
      }
    },
  })

  const { execute: loadDogs, isPending: isLoadingDogs } = useAction(fetchDogsForClient, {
    onSuccess: ({ data }) => {
      if (data?.dogs) {
        setDogs(data.dogs)
        if (data.dogs.length === 1) {
          handleDogChange(data.dogs[0].id)
        }
      }
    },
  })

  const { execute: loadStations, isPending: isLoadingStations } = useAction(fetchStationsForLocation, {
    onSuccess: ({ data }) => {
      if (data?.stations) {
        setStationsList(data.stations)
      }
    },
  })

  const { execute: loadServicesForStation, isPending: isLoadingServicesForStation } = useAction(fetchServicesForStation, {
    onSuccess: ({ data }) => {
      if (data?.services) {
        setServices(data.services)
      }
    },
  })

  const { execute: loadServices, isPending: isLoadingAllServices } = useAction(fetchAllServices, {
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

  // Load stations for location and services on mount
  useEffect(() => {
    loadStations({ locationId: prefilledSlot.locationId })
    if (prefilledSlot.stationId) {
      loadServicesForStation({ stationId: prefilledSlot.stationId })
    } else {
      loadServices({})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDogChange = (dogId: string) => {
    setSelectedDogId(dogId)
    setBusinessError(null)
    setPriceIsManual(false)
    if (selectedServiceId) {
      const dog = dogs.find(d => d.id === dogId)
      if (dog) {
        const { coat, size } = getEffectiveCoatSize(dog)
        if (coat && size) {
          setPriceHint({ coat, size })
          executeFetchPrice({ serviceId: selectedServiceId, coatType: coat, sizeType: size })
        } else {
          const service = services.find(s => s.id === selectedServiceId)
          if (service) {
            setBasePriceForMatrix(service.price)
            setPriceEur(String(Math.round(service.price / 100)))
          }
          setPriceHint('base')
        }
      }
    }
  }

  const handleClientSelect = (client: SelectedClient) => {
    setSelectedClient(client)
    setSelectedDogId(null)
    setDogs([])
    setShowQuickDog(false)
    setBusinessError(null)
    loadDogs({ clientId: client.id })
  }

  const handleDogCreated = (dog: { id: string; name: string }) => {
    setShowQuickDog(false)
    if (selectedClient) {
      loadDogs({ clientId: selectedClient.id })
    }
  }

  const handleClientCreated = (client: { id: string; nominativo: string }) => {
    setShowQuickClient(false)
    handleClientSelect(client)
  }

  const handleStationChange = (value: string) => {
    const stationId = value === '__all__' ? null : value
    setSelectedStationId(stationId)
    setSelectedServiceId(null)
    setDuration(0)
    setPriceEur('')
    setBasePriceForMatrix(null)
    setPriceIsManual(false)
    setPriceHint(null)
    setBusinessError(null)
    if (stationId) {
      loadServicesForStation({ stationId })
    } else {
      loadServices({})
    }
  }

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setBusinessError(null)
    setPriceIsManual(false)
    const service = services.find((s) => s.id === serviceId)
    if (!service) return
    setDuration(service.duration)
    const dog = dogs.find(d => d.id === selectedDogId)
    if (dog) {
      const { coat, size } = getEffectiveCoatSize(dog)
      if (coat && size) {
        setPriceHint({ coat, size })
        executeFetchPrice({ serviceId, coatType: coat, sizeType: size })
      } else {
        setBasePriceForMatrix(service.price)
        setPriceEur(String(Math.round(service.price / 100)))
        setPriceHint('base')
      }
    } else {
      setBasePriceForMatrix(service.price)
      setPriceEur(String(Math.round(service.price / 100)))
      setPriceHint(null)
    }
  }

  const handleAlternativeSlotClick = (time: string) => {
    setBusinessError(null)
    if (selectedClient && selectedDogId && selectedServiceId && selectedUserId) {
      const priceCents = Math.round(parseFloat(priceEur) * 100)
      submitAppointment({
        userId: selectedUserId,
        locationId: prefilledSlot.locationId,
        date: prefilledSlot.date,
        time,
        clientId: selectedClient.id,
        dogId: selectedDogId,
        serviceId: selectedServiceId,
        duration,
        price: priceCents,
        ...(selectedStationId && { stationId: selectedStationId }),
      })
    }
  }

  const handleAlternativeStaffClick = (userId: string) => {
    setBusinessError(null)
    setSelectedUserId(userId)
    if (selectedClient && selectedDogId && selectedServiceId) {
      const priceCents = Math.round(parseFloat(priceEur) * 100)
      submitAppointment({
        userId,
        locationId: prefilledSlot.locationId,
        date: prefilledSlot.date,
        time: prefilledSlot.time,
        clientId: selectedClient.id,
        dogId: selectedDogId,
        serviceId: selectedServiceId,
        duration,
        price: priceCents,
        ...(selectedStationId && { stationId: selectedStationId }),
      })
    }
  }

  const handleSubmit = () => {
    if (!selectedClient || !selectedDogId || !selectedServiceId || !selectedUserId) return
    setBusinessError(null)
    const priceCents = Math.round(parseFloat(priceEur) * 100)
    submitAppointment({
      userId: selectedUserId,
      locationId: prefilledSlot.locationId,
      date: prefilledSlot.date,
      time: prefilledSlot.time,
      clientId: selectedClient.id,
      dogId: selectedDogId,
      serviceId: selectedServiceId,
      duration,
      price: priceCents,
      ...(selectedStationId && { stationId: selectedStationId }),
    })
  }

  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(prefilledSlot.date + 'T00:00:00.000Z'))

  const isFormComplete = selectedClient && selectedDogId && selectedServiceId && duration >= 15 && parseFloat(priceEur) >= 0 && !!selectedUserId

  return (
    <div className="space-y-4">
      {/* Header: slot pre-compilato */}
      <div className="bg-muted/50 flex flex-wrap items-center gap-3 rounded-lg p-3">
        {prefilledSlot.stationName ? (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">{prefilledSlot.stationName}</span>
          </div>
        ) : prefilledSlot.userName ? (
          <div className="flex items-center gap-1.5 text-sm">
            <User className="text-muted-foreground size-4" />
            <span className="font-medium">{prefilledSlot.userName}</span>
          </div>
        ) : null}
        {(prefilledSlot.stationName || prefilledSlot.userName) && (
          <Separator orientation="vertical" className="h-4" />
        )}
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

      {/* Collaboratore — mostrato quando non pre-compilato */}
      {!prefilledSlot.userId && availableStaff && availableStaff.length > 0 && (
        <div>
          <Label className="mb-1.5 block text-sm font-medium">Collaboratore</Label>
          <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona collaboratore" />
            </SelectTrigger>
            <SelectContent>
              {availableStaff.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sezione cliente */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium">Cliente</Label>
        {showQuickClient ? (
          <QuickClientForm
            onCreated={handleClientCreated}
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
              onClick={() => {
                setSelectedClient(null)
                setSelectedDogId(null)
                setDogs([])
                setSelectedStationId(null)
                setSelectedServiceId(null)
                setDuration(0)
                setPriceEur('')
                setBasePriceForMatrix(null)
                setPriceIsManual(false)
                setPriceHint(null)
                setBusinessError(null)
                loadServices({})
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
          ) : showQuickDog ? (
            <QuickDogForm
              clientId={selectedClient!.id}
              onCreated={handleDogCreated}
              onCancel={() => setShowQuickDog(false)}
            />
          ) : dogs.length === 0 ? (
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">Nessun cane associato</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickDog(true)}
              >
                + Aggiungi cane
              </Button>
            </div>
          ) : dogs.length === 1 ? (
            <div className="rounded-lg border p-2.5 text-sm">
              <span className="font-medium">{dogs[0].name}</span>
              {dogs[0].breedName && <span className="text-muted-foreground ml-1">({dogs[0].breedName})</span>}
            </div>
          ) : (
            <Select value={selectedDogId ?? undefined} onValueChange={handleDogChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona cane" />
              </SelectTrigger>
              <SelectContent>
                {dogs.map((dog) => (
                  <SelectItem key={dog.id} value={dog.id}>
                    {dog.name}{dog.breedName ? ` (${dog.breedName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Sezione postazione — mostrata solo dopo selezione cane */}
      {selectedDogId && (
        <div>
          <Label className="mb-1.5 block text-sm font-medium">Postazione (opzionale)</Label>
          {isLoadingStations ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Caricamento postazioni...
            </div>
          ) : (
            <Select value={selectedStationId ?? '__all__'} onValueChange={handleStationChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tutte le postazioni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tutte le postazioni</SelectItem>
                {stationsList.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
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
          {(isLoadingAllServices || isLoadingServicesForStation) ? (
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
                const newDuration = parseInt(e.target.value) || 0
                setDuration(newDuration)
                setBusinessError(null)
                if (basePriceForMatrix !== null && !priceIsManual) {
                  const service = services.find(s => s.id === selectedServiceId)
                  if (service && service.durationSurchargePer30min > 0) {
                    const extraMinutes = Math.max(0, newDuration - service.duration)
                    const surchargeUnits = Math.floor(extraMinutes / 30)
                    const totalPrice = basePriceForMatrix + surchargeUnits * service.durationSurchargePer30min
                    setPriceEur(String(Math.round(totalPrice / 100)))
                  }
                }
              }}
            />
            {(() => {
              const service = services.find(s => s.id === selectedServiceId)
              if (service && service.durationSurchargePer30min > 0) {
                return (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ogni 30min aggiuntivi: +€{Math.round(service.durationSurchargePer30min / 100)},00
                  </p>
                )
              }
              return null
            })()}
          </div>
          <div>
            <Label htmlFor="af-price" className="mb-1.5 block text-sm font-medium">Prezzo (EUR)</Label>
            <Input
              id="af-price"
              type="number"
              min={0}
              step="1"
              value={priceEur}
              onChange={(e) => {
                setPriceEur(e.target.value)
                setPriceIsManual(true)
              }}
            />
            {priceHint === 'base' && (
              <p className="text-xs text-muted-foreground mt-1">
                Pelo/taglia non configurati — uso prezzo base{' '}
                {selectedDogId && (
                  <a
                    href={`/dogs/${selectedDogId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Configura pelo/taglia
                  </a>
                )}
              </p>
            )}
            {priceHint && priceHint !== 'base' && (priceHint.coat || priceHint.size) && (
              <p className="text-xs text-muted-foreground mt-1">
                (prezzo:{priceHint.coat ? ` Pelo ${COAT_LABELS[priceHint.coat as CoatType] ?? priceHint.coat}` : ''}
                {priceHint.size ? ` · Taglia ${SIZE_LABELS[priceHint.size as SizeType] ?? priceHint.size}` : ''})
              </p>
            )}
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
          {businessError.code === 'SLOT_OCCUPIED' && businessError.alternativeStaff && businessError.alternativeStaff.length > 0 && (
            <div className="mt-2">
              <p className="text-muted-foreground mb-1.5 text-xs">Collaboratori disponibili allo stesso orario:</p>
              <div className="flex flex-wrap gap-1.5">
                {businessError.alternativeStaff.map((person) => (
                  <Button
                    key={person.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlternativeStaffClick(person.id)}
                  >
                    {person.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {businessError.code === 'EXCEEDS_SHIFT_TIME' && businessError.shiftEndTime && (
            <p className="text-muted-foreground mt-1 text-xs">
              Fine turno alle {businessError.shiftEndTime}. Riduci la durata per procedere.
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

    </div>
  )
}
