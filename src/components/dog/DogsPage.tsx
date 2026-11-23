'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronRight, Download } from 'lucide-react'
import { buildCsv, csvDate, csvFilename, downloadCsv } from '@/lib/utils/csv'

interface Dog {
  id: string
  name: string
  breedName: string | null
  coatType: string | null
  sizeType: string | null
  breedCoatType: string | null
  breedSizeType: string | null
  size: string | null
  sex: string | null
  dateOfBirth: Date | string | null
  sterilized: boolean
  clientNominativo: string
  clientPhone: string
  clientId: string
}

interface DogsPageProps {
  dogs: Dog[]
}

const COAT_LABELS: Record<string, string> = { short: 'Corto', medium: 'Medio', long: 'Lungo' }
const SIZE_LABELS: Record<string, string> = { toy: 'Toy', small: 'Piccola', medium: 'Media', large: 'Grande', giant: 'Gigante' }

const sexLabel: Record<string, string> = {
  maschio: 'Maschio',
  femmina: 'Femmina',
}

// Pelo e taglia effettivi: quelli del cane, o quelli ereditati dalla sua razza.
// Stessa derivazione che fanno l'export qui sotto e DogList: senza il fallback
// l'elenco mostrava '-' per ogni cane che eredita i valori dalla razza, mentre
// la scheda del cliente e il CSV della stessa pagina li mostravano.
function peloTaglia(dog: Dog): { coat: string | null; size: string | null; parts: string[] } {
  const coat = dog.coatType ?? dog.breedCoatType
  const size = dog.sizeType ?? dog.breedSizeType
  const parts = [
    coat ? `Pelo ${COAT_LABELS[coat] ?? coat}` : null,
    size ? `Taglia ${SIZE_LABELS[size] ?? size}` : null,
  ].filter((v): v is string => v !== null)
  return { coat, size, parts }
}

export function DogsPage({ dogs }: DogsPageProps) {
  const router = useRouter()

  // Pelo e taglia esportati sono quelli effettivi: del cane, o della sua razza.
  function handleExport() {
    const headers = [
      'Nome', 'Razza', 'Pelo', 'Taglia', 'Pelo/taglia da razza',
      'Sesso', 'Data di nascita', 'Sterilizzato', 'Proprietario', 'Telefono proprietario',
    ]
    const rows = dogs.map((dog) => {
      const { coat, size } = peloTaglia(dog)
      const daRazza = (!dog.coatType && dog.breedCoatType) || (!dog.sizeType && dog.breedSizeType)
      return [
        dog.name,
        dog.breedName ?? '',
        coat ? COAT_LABELS[coat] ?? coat : '',
        size ? SIZE_LABELS[size] ?? size : '',
        daRazza ? 'Si' : 'No',
        dog.sex ? sexLabel[dog.sex] ?? dog.sex : '',
        csvDate(dog.dateOfBirth),
        dog.sterilized ? 'Si' : 'No',
        dog.clientNominativo,
        dog.clientPhone,
      ]
    })
    downloadCsv(csvFilename('cani'), buildCsv(headers, rows))
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold leading-tight text-foreground">Cani</h1>
          <p className="text-sm text-muted-foreground">
            {dogs.length === 0
              ? 'I cani si aggiungono dalla scheda del cliente'
              : `${dogs.length} ${dogs.length === 1 ? 'cane registrato' : 'cani registrati'}`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={dogs.length === 0}
          title="Scarica l'elenco in un file apribile con Excel"
          className="shrink-0"
        >
          <Download className="size-4 mr-2" />
          Esporta
        </Button>
      </header>

      {dogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nessun cane registrato: aprire un cliente e aggiungere il suo cane da li&apos;
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: tabella */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Razza</TableHead>
                  <TableHead>Pelo / taglia</TableHead>
                  <TableHead>Sesso</TableHead>
                  <TableHead>Proprietario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dogs.map((dog) => (
                  <TableRow
                    key={dog.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dogs/${dog.id}`)}
                  >
                    <TableCell className="font-medium">{dog.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dog.breedName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(() => {
                        const { parts } = peloTaglia(dog)
                        return parts.length > 0 ? parts.join(' · ') : '—'
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dog.sex ? sexLabel[dog.sex] || dog.sex : '—'}
                    </TableCell>
                    <TableCell>{dog.clientNominativo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: schede */}
          <div className="flex flex-col gap-3 md:hidden">
            {dogs.map((dog) => (
              <button
                key={dog.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
                onClick={() => router.push(`/dogs/${dog.id}`)}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-foreground">{dog.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {(() => {
                      const parts = [dog.breedName, ...peloTaglia(dog).parts].filter(Boolean)
                      return parts.length > 0 ? parts.join(' · ') : 'Nessun dettaglio'
                    })()}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{dog.clientNominativo}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
