'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { Check, Phone, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { setPhoneMessageRead } from '@/lib/actions/phone-messages'

export interface PhoneMessage {
  id: string
  createdAt: Date
  readAt: Date | null
  name: string | null
  phone: string | null
  message: string
  clientId: string | null
  clientNominativo: string | null
  locationName: string | null
}

// La data di un messaggio e' un istante vero (now() del database), non "UTC nudo" come gli
// appuntamenti: si mostra nel fuso del negozio, uguale sul server e nel browser.
const QUANDO = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * I messaggi lasciati al telefono all'assistente vocale: disdette, richieste per oggi,
 * cani difficili, tutto quello che l'assistente non fa da solo.
 */
export function PhoneMessageList({ messages }: { messages: PhoneMessage[] }) {
  const router = useRouter()
  const daLeggere = messages.filter((m) => !m.readAt).length

  const { execute, isPending } = useAction(setPhoneMessageRead, {
    onSuccess: () => router.refresh(),
    onError: (e) => toast.error(e.error?.serverError || 'Non sono riuscito a salvare'),
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-medium leading-tight text-foreground">Messaggi dal telefono</h1>
        <p className="text-sm text-muted-foreground">
          {daLeggere === 0
            ? 'Nessun messaggio da leggere.'
            : daLeggere === 1
              ? '1 messaggio da leggere.'
              : `${daLeggere} messaggi da leggere.`}{' '}
          Li lascia l&apos;assistente vocale quando non può fare da solo.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-foreground">Ancora nessun messaggio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Qui arrivano le richieste che l&apos;assistente vocale non riesce a chiudere da solo:
            disdette, cani difficili, richieste per oggi.
          </p>
        </div>
      )}

      {messages.map((m) => {
        const quando = QUANDO.format(new Date(m.createdAt))
        const chi = m.clientNominativo || m.name || 'Senza nome'
        return (
          <article
            key={m.id}
            className={cn(
              'rounded-xl border border-border bg-card p-4 shadow-xs',
              // Letto e non letto non si distinguono per il solo colore: il non letto
              // porta l'etichetta "Da leggere" e il nome in grassetto.
              !m.readAt && 'border-primary/40 bg-accent/50 shadow-sm'
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
              <p
                className={cn(
                  'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm',
                  m.readAt ? 'font-medium text-muted-foreground' : 'font-semibold text-foreground'
                )}
              >
                {m.clientId ? (
                  <Link href={`/clients/${m.clientId}`} className="underline-offset-2 hover:underline">
                    {chi}
                  </Link>
                ) : (
                  <span>{chi}</span>
                )}
                {m.readAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium leading-4 text-muted-foreground">
                    <Check className="size-3" />
                    Letto
                  </span>
                ) : (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium leading-4 text-primary-foreground">
                    Da leggere
                  </span>
                )}
                {m.phone && (
                  <a
                    href={`tel:${m.phone}`}
                    className="inline-flex items-center gap-1 font-normal text-primary underline-offset-2 hover:underline"
                  >
                    <Phone className="size-3" />
                    {m.phone}
                  </a>
                )}
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {quando}
                {m.locationName && ` · ${m.locationName}`}
              </span>
            </div>
            <p
              className={cn(
                'mt-3 whitespace-pre-wrap text-sm leading-relaxed',
                m.readAt ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {m.message}
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => execute({ id: m.id, read: !m.readAt })}
              >
                {m.readAt ? <Undo2 className="mr-1 size-4" /> : <Check className="mr-1 size-4" />}
                {m.readAt ? 'Da rileggere' : 'Letto'}
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
