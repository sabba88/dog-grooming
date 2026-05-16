'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DogForm } from '@/components/dog/DogForm'
import { DogNotes } from '@/components/dog/DogNotes'
import { ArrowLeft, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Dog {
  id: string
  name: string
  breedId: string | null
  breedName: string | null
  coatType: string | null
  sizeType: string | null
  breedCoatType: string | null
  breedSizeType: string | null
  size: string | null
  dateOfBirth: Date | null
  sex: string | null
  sterilized: boolean
  clientId: string
  createdAt: Date | null
  updatedAt: Date | null
  clientNominativo: string
}

interface Note {
  id: string
  content: string
  createdAt: Date | null
  authorName: string
}

interface ServiceNote {
  id: string
  startTime: Date
  serviceName: string
  notes: string | null
}

interface DogDetailProps {
  dog: Dog
  notes: Note[]
  breeds: { id: string; name: string; coatType: string | null; sizeType: string | null }[]
  serviceNotes: ServiceNote[]
  userRole: 'admin' | 'collaborator'
}

const COAT_TYPE_LABELS: Record<string, string> = {
  short: 'Corto', medium: 'Medio', long: 'Lungo',
}
const SIZE_TYPE_LABELS: Record<string, string> = {
  toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante',
}

const sexLabel: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' })

export function DogDetail({ dog, notes, breeds, serviceNotes, userRole }: DogDetailProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  function handleSuccess() {
    router.refresh()
  }

  const effectiveCoatType = dog.coatType ?? dog.breedCoatType ?? null
  const effectiveSizeType = dog.sizeType ?? dog.breedSizeType ?? null
  const coatFromBreed = !dog.coatType && !!dog.breedCoatType
  const sizeFromBreed = !dog.sizeType && !!dog.breedSizeType

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Clienti
        </Button>
        <span className="text-muted-foreground">/</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => router.push(`/clients/${dog.clientId}`)}
        >
          {dog.clientNominativo}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{dog.name}</span>
      </div>

      {/* Dati Cane */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Dati Cane</h2>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Modifica
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nome</p>
            <p className="text-sm text-foreground">{dog.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Razza</p>
            <p className="text-sm text-foreground">{dog.breedName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Data di Nascita</p>
            <p className="text-sm text-foreground">
              {dog.dateOfBirth ? dateFormatter.format(dog.dateOfBirth) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sesso</p>
            <p className="text-sm text-foreground">
              {dog.sex ? sexLabel[dog.sex] || dog.sex : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sterilizzato</p>
            <p className="text-sm text-foreground">
              {dog.sterilized ? 'Si' : 'No'}
            </p>
          </div>

          {/* Profilo prezzo — pelo e taglia effettivi */}
          {(effectiveCoatType || effectiveSizeType) && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Profilo Prezzo</p>
              <p className="text-sm font-medium text-primary">
                {effectiveCoatType && (
                  <>
                    Pelo {COAT_TYPE_LABELS[effectiveCoatType]}
                    {coatFromBreed && <span className="text-xs text-muted-foreground ml-1">(da razza)</span>}
                  </>
                )}
                {effectiveCoatType && effectiveSizeType && ' · '}
                {effectiveSizeType && (
                  <>
                    Taglia {SIZE_TYPE_LABELS[effectiveSizeType]}
                    {sizeFromBreed && <span className="text-xs text-muted-foreground ml-1">(da razza)</span>}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Avviso soft — nessun pelo/taglia configurato */}
          {!effectiveCoatType && !effectiveSizeType && (
            <div className="sm:col-span-2">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Pelo/taglia non configurati — il prezzo degli appuntamenti userà il prezzo base del servizio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Note Cane */}
      <div className="mb-6">
        <DogNotes dogId={dog.id} notes={notes} />
      </div>

      <Separator className="my-6" />

      {/* Storico Note Prestazione */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Storico Note Prestazione</h2>
        {serviceNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna nota prestazione registrata</p>
        ) : (
          <div className="flex flex-col">
            {serviceNotes.map((note, index) => (
              <div key={note.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.startTime), 'd MMM yyyy', { locale: it })} · {note.serviceName}
                  </p>
                  <p className="text-sm text-foreground">{note.notes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DogForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        clientId={dog.clientId}
        breeds={breeds}
        userRole={userRole}
        dog={dog}
      />
    </>
  )
}
