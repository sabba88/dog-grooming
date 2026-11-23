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
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-medium text-foreground">Note sul cliente</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Quello che conviene sapere prima di richiamarlo
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
        <Textarea
          placeholder="Aggiungi una nota..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <Button
          type="submit"
          disabled={isPending || content.trim().length === 0}
          size="sm"
          className="self-end"
        >
          {isPending ? 'Salvataggio...' : 'Aggiungi nota'}
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nessuna nota per ora
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-border bg-muted/40 p-3">
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {note.authorName}
                {note.createdAt ? ` · ${dateFormatter.format(new Date(note.createdAt))}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
