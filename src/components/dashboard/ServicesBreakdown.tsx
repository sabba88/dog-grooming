import { getServiceSpine } from '@/lib/utils/schedule'

interface ServicesBreakdownProps {
  data: { id: string; name: string; count: number; revenue: number }[]
}

function formatEur(cents: number) {
  return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

/**
 * Una ripartizione a cinque voci si legge meglio in fila che a spicchi: il nome sta
 * accanto alla barra, quindi il colore non e' mai l'unica cosa che distingue un
 * servizio. E' lo stesso colore che il servizio ha come spina in agenda.
 */
export function ServicesBreakdown({ data }: ServicesBreakdownProps) {
  if (data.length === 0) {
    return (
      <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        Nessun appuntamento questo mese
      </p>
    )
  }

  const max = data.reduce((m, d) => (d.count > m ? d.count : m), 0)

  return (
    <ul className="flex flex-col gap-4">
      {data.map((service) => (
        <li key={service.id} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm">{service.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {service.count} · {formatEur(service.revenue)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${max === 0 ? 0 : Math.round((service.count / max) * 100)}%`,
                backgroundColor: getServiceSpine(service.id),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
