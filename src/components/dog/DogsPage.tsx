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

interface Dog {
  id: string
  name: string
  breedName: string | null
  coatType: string | null
  sizeType: string | null
  size: string | null
  sex: string | null
  clientNominativo: string
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

export function DogsPage({ dogs }: DogsPageProps) {
  const router = useRouter()

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Cani</h1>
      </div>

      {dogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nessun cane registrato</p>
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Razza</TableHead>
                  <TableHead>Pelo / Taglia</TableHead>
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
                    <TableCell>{dog.breedName || '—'}</TableCell>
                    <TableCell>
                      {(() => {
                        const parts = [
                          dog.coatType ? `Pelo ${COAT_LABELS[dog.coatType] ?? dog.coatType}` : null,
                          dog.sizeType ? `Taglia ${SIZE_LABELS[dog.sizeType] ?? dog.sizeType}` : null,
                        ].filter(Boolean)
                        return parts.length > 0 ? parts.join(' · ') : '—'
                      })()}
                    </TableCell>
                    <TableCell>
                      {dog.sex ? sexLabel[dog.sex] || dog.sex : '—'}
                    </TableCell>
                    <TableCell>{dog.clientNominativo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {dogs.map((dog) => (
              <button
                key={dog.id}
                type="button"
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left w-full hover:bg-muted/50"
                onClick={() => router.push(`/dogs/${dog.id}`)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">
                    {dog.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const parts = [
                        dog.breedName,
                        dog.coatType ? `Pelo ${COAT_LABELS[dog.coatType] ?? dog.coatType}` : null,
                        dog.sizeType ? `Taglia ${SIZE_LABELS[dog.sizeType] ?? dog.sizeType}` : null,
                      ].filter(Boolean)
                      return parts.length > 0 ? parts.join(' · ') : 'Nessun dettaglio'
                    })()}
                  </span>
                  <span className="text-sm text-muted-foreground">{dog.clientNominativo}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
