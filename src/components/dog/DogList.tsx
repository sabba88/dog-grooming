'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DogForm } from '@/components/dog/DogForm'
import { Plus } from 'lucide-react'

interface Dog {
  id: string
  name: string
  breed: string | null
  size: string | null
  dateOfBirth: Date | null
  sex: string | null
  sterilized: boolean
  createdAt: Date | null
}

interface DogListProps {
  clientId: string
  dogs: Dog[]
}

export function DogList({ clientId, dogs }: DogListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  function handleSuccess() {
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Cani Associati</h2>
        <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Aggiungi Cane
        </Button>
      </div>

      {dogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Nessun cane associato</p>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Aggiungi il primo cane
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dogs.map((dog) => (
            <button
              key={dog.id}
              type="button"
              className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 text-left w-full hover:bg-muted/50"
              onClick={() => router.push(`/dogs/${dog.id}`)}
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground">{dog.name}</span>
                <span className="text-sm text-muted-foreground">
                  {[dog.breed, dog.size ? `Taglia ${dog.size}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Nessun dettaglio'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <DogForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        clientId={clientId}
      />
    </div>
  )
}
