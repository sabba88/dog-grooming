'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DogForm } from '@/components/dog/DogForm'
import { ChevronRight, Plus } from 'lucide-react'

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
  createdAt: Date | null
}

const COAT_LABELS: Record<string, string> = { short: 'Corto', medium: 'Medio', long: 'Lungo' }
const SIZE_LABELS: Record<string, string> = { toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante' }

interface DogListProps {
  clientId: string
  dogs: Dog[]
  breeds: { id: string; name: string; coatType: string | null; sizeType: string | null }[]
  userRole: 'admin' | 'collaborator'
}

export function DogList({ clientId, dogs, breeds, userRole }: DogListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  function handleSuccess() {
    router.refresh()
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium text-foreground">Cani</h2>
          <p className="text-xs text-muted-foreground">
            {dogs.length === 0
              ? 'Nessuno ancora associato'
              : `${dogs.length} ${dogs.length === 1 ? 'cane associato' : 'cani associati'}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4 mr-1" />
          Aggiungi cane
        </Button>
      </div>

      {dogs.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            A questo cliente non e&apos; ancora associato nessun cane
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="size-4 mr-1" />
            Aggiungi il primo cane
          </Button>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {dogs.map((dog) => (
            <li key={dog.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md border border-border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60"
                onClick={() => router.push(`/dogs/${dog.id}`)}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{dog.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {(() => {
                      const effectiveCoat = dog.coatType ?? dog.breedCoatType ?? null
                      const effectiveSize = dog.sizeType ?? dog.breedSizeType ?? null
                      const parts = [
                        dog.breedName,
                        effectiveCoat ? `Pelo ${COAT_LABELS[effectiveCoat] ?? effectiveCoat}` : null,
                        effectiveSize ? `Taglia ${SIZE_LABELS[effectiveSize] ?? effectiveSize}` : null,
                      ].filter(Boolean)
                      return parts.length > 0 ? parts.join(' · ') : 'Nessun dettaglio'
                    })()}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <DogForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        clientId={clientId}
        breeds={breeds}
        userRole={userRole}
      />
    </section>
  )
}
