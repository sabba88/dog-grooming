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
  breed: string | null
  size: string | null
  sex: string | null
  clientFirstName: string
  clientLastName: string
  clientId: string
}

interface DogsPageProps {
  dogs: Dog[]
}

const sizeLabel: Record<string, string> = {
  piccola: 'Piccola',
  media: 'Media',
  grande: 'Grande',
}

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
                  <TableHead>Taglia</TableHead>
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
                    <TableCell>{dog.breed || '—'}</TableCell>
                    <TableCell>
                      {dog.size ? sizeLabel[dog.size] || dog.size : '—'}
                    </TableCell>
                    <TableCell>
                      {dog.sex ? sexLabel[dog.sex] || dog.sex : '—'}
                    </TableCell>
                    <TableCell>
                      {dog.clientFirstName} {dog.clientLastName}
                    </TableCell>
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
                    {[
                      dog.breed,
                      dog.size ? sizeLabel[dog.size] || dog.size : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Nessun dettaglio'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {dog.clientFirstName} {dog.clientLastName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
