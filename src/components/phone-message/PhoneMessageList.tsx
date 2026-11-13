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
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Messaggi dal telefono</h1>
        <p className="text-sm text-muted-foreground">
          {daLeggere === 0
            ? 'Nessun messaggio da leggere.'
            : daLeggere === 1
              ? '1 messaggio da leggere.'
              : `${daLeggere} messaggi da leggere.`}{' '}
          Li lascia l&apos;assistente vocale quando non può fare da solo.
        </p>
      </div>

      {messages.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ancora nessun messaggio.
        </p>
      )}

      {messages.map((m) => {
        const quando = QUANDO.format(new Date(m.createdAt))
        const chi = m.clientNominativo || m.name || 'Senza nome'
        return (
          <div
            key={m.id}
            className={cn(
              'rounded-lg border p-4',
              m.readAt ? 'bg-card text-muted-foreground' : 'border-sky-300 bg-sky-50'
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {m.clientId ? (
                  <Link href={`/clients/${m.clientId}`} className="underline-offset-2 hover:underline">
                    {chi}
                  </Link>
                ) : (
                  chi
                )}
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="ml-2 inline-flex items-center gap-1 font-normal text-sky-700">
                    <Phone className="size-3" />
                    {m.phone}
                  </a>
                )}
              </p>
              <span className="text-xs">
                {quando}
                {m.locationName && ` · ${m.locationName}`}
              </span>
            </div>
            <p className={cn('mt-2 whitespace-pre-wrap text-sm', !m.readAt && 'text-foreground')}>{m.message}</p>
            <div className="mt-3 flex justify-end">
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
          </div>
        )
      })}
    </div>
  )
}
