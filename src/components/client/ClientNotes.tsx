'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addClientNote } from '@/lib/actions/clients'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

interface Note {
  id: string
  content: string
  createdAt: Date | null
  authorName: string
}

interface ClientNotesProps {
  clientId: string
  notes: Note[]
}

export function ClientNotes({ clientId, notes }: ClientNotesProps) {
  const router = useRouter()
  const [content, setContent] = useState('')

  const { execute, isPending } = useAction(addClientNote, {
    onSuccess: () => {
      toast.success('Nota aggiunta')
      setContent('')
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.error?.serverError || "Errore durante l'aggiunta della nota")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (content.trim().length === 0) return
    execute({ clientId, content: content.trim() })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Note</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <Textarea
          placeholder="Aggiungi una nota..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || content.trim().length === 0} size="sm">
            {isPending ? 'Salvataggio...' : 'Aggiungi Nota'}
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna nota</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{note.authorName}</span>
                <span>·</span>
                <span>{note.createdAt ? dateFormatter.format(new Date(note.createdAt)) : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
