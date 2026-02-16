'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DogForm } from '@/components/dog/DogForm'
import { DogNotes } from '@/components/dog/DogNotes'
import { ArrowLeft, Pencil } from 'lucide-react'

interface Dog {
  id: string
  name: string
  breed: string | null
  size: string | null
  age: string | null
  clientId: string
  createdAt: Date | null
  updatedAt: Date | null
  clientFirstName: string
  clientLastName: string
}

interface Note {
  id: string
  content: string
  createdAt: Date | null
  authorName: string
}

interface DogDetailProps {
  dog: Dog
  notes: Note[]
}

export function DogDetail({ dog, notes }: DogDetailProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)

  function handleSuccess() {
    router.refresh()
  }

  const sizeLabel: Record<string, string> = {
    piccola: 'Piccola',
    media: 'Media',
    grande: 'Grande',
  }

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
          {dog.clientFirstName} {dog.clientLastName}
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
            <p className="text-sm text-foreground">{dog.breed || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Taglia</p>
            <p className="text-sm text-foreground">
              {dog.size ? sizeLabel[dog.size] || dog.size : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Eta</p>
            <p className="text-sm text-foreground">{dog.age || '—'}</p>
          </div>
        </div>
      </div>

      {/* Note Cane */}
      <div className="mb-6">
        <DogNotes dogId={dog.id} notes={notes} />
      </div>

      <Separator className="my-6" />

      {/* Storico Note Prestazione — placeholder per Epica 4 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Storico Note Prestazione</h2>
        <p className="text-sm text-muted-foreground">
          Nessuna nota prestazione registrata — Le note verranno aggiunte durante gli appuntamenti
        </p>
      </div>

      <DogForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        clientId={dog.clientId}
        dog={dog}
      />
    </>
  )
}
