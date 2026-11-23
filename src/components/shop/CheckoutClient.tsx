'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { addProductToAppointment, removeProductFromAppointment } from '@/lib/actions/products'
import { formatPrice } from '@/lib/utils/formatting'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Minus, Plus, Trash2, Search } from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  startTime: Date
  price: number
  clientNominativo: string
  dogName: string
  serviceName: string
}

interface AvailableProduct {
  id: string
  name: string
  price: number
  stock: number
}

interface SoldProduct {
  id: string
  productId: string
  productName: string
  quantity: number
  priceAtSale: number
}

interface CheckoutClientProps {
  appointment: Appointment
  availableProducts: AvailableProduct[]
  initialSoldProducts: SoldProduct[]
}

export function CheckoutClient({ appointment, availableProducts, initialSoldProducts }: CheckoutClientProps) {
  const router = useRouter()
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>(initialSoldProducts)
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const { execute: execAdd, isPending: isAdding } = useAction(addProductToAppointment, {
    onSuccess: (result) => {
      const entry = result.data?.entry
      if (!entry) return
      const prod = availableProducts.find((p) => p.id === entry.productId)
      if (!prod) return
      setSoldProducts((prev) => [
        { id: entry.id, productId: entry.productId, productName: prod.name, quantity: entry.quantity, priceAtSale: entry.priceAtSale },
        ...prev,
      ])
      setQuantities((prev) => ({ ...prev, [entry.productId]: 1 }))
      router.refresh()
    },
    onError: (e) => toast.error(e.error?.serverError || 'Errore'),
  })

  const { execute: execRemove } = useAction(removeProductFromAppointment, {
    onSuccess: ({ data }) => {
      if (data?.deletedId) {
        setSoldProducts((prev) => prev.filter((s) => s.id !== data.deletedId))
      }
      router.refresh()
    },
    onError: (e) => toast.error(e.error?.serverError || 'Errore'),
  })

  const filteredProducts = availableProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalProducts = soldProducts.reduce((sum, s) => sum + s.priceAtSale * s.quantity, 0)
  const grandTotal = appointment.price + totalProducts

  function getQty(productId: string) {
    return quantities[productId] ?? 1
  }

  function handleAdd(product: AvailableProduct) {
    const qty = getQty(product.id)
    execAdd({ appointmentId: appointment.id, productId: product.id, quantity: qty })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12">
      <header className="flex flex-col gap-3">
        <Link href="/bookings" className="self-start">
          <Button variant="ghost" size="sm" className="-ml-2 px-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Torna all&apos;agenda
          </Button>
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold text-foreground">Cassa appuntamento</h1>
          <p className="text-sm text-muted-foreground">
            Il servizio e&apos; gia&apos; conteggiato: qui si aggiungono i prodotti venduti.
          </p>
        </div>
      </header>

      {/* Riepilogo appuntamento */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-medium text-foreground">
            {appointment.dogName}
            <span className="font-normal text-muted-foreground"> · {appointment.clientNominativo}</span>
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {format(new Date(appointment.startTime), 'EEE d MMM yyyy', { locale: it })}
          </p>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">{appointment.serviceName}</span>
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatPrice(appointment.price)}
          </span>
        </div>
      </section>

      {/* Ricerca prodotti */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium text-foreground">Aggiungi prodotti</h2>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cerca prodotto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {filteredProducts.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {availableProducts.length === 0
                ? 'Nessun prodotto a magazzino'
                : 'Nessun prodotto corrisponde alla ricerca'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Prodotto</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Prezzo</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Disponibili</TableHead>
                  <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">
                    Quantita&apos;
                  </TableHead>
                  <TableHead className="px-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">
                      {formatPrice(p.price)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {p.stock === 0 ? (
                        <Badge variant="destructive">Esaurito</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground tabular-nums">{p.stock} pz</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Togli una unita' di ${p.name}`}
                          onClick={() => setQuantities((prev) => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] ?? 1) - 1) }))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums">
                          {getQty(p.id)}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Aggiungi una unita' di ${p.name}`}
                          onClick={() => setQuantities((prev) => ({ ...prev, [p.id]: Math.min(p.stock, (prev[p.id] ?? 1) + 1) }))}
                          disabled={getQty(p.id) >= p.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        disabled={p.stock === 0 || isAdding}
                        onClick={() => handleAdd(p)}
                      >
                        Aggiungi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* Prodotti venduti */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium text-foreground">Prodotti venduti</h2>
        {soldProducts.length === 0 ? (
          <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nessun prodotto aggiunto a questo appuntamento
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Prodotto</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Quantita&apos;</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Prezzo</TableHead>
                  <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">Totale</TableHead>
                  <TableHead className="px-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldProducts.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{s.productName}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{s.quantity}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">
                      {formatPrice(s.priceAtSale)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatPrice(s.priceAtSale * s.quantity)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Togli ${s.productName} dalla vendita`}
                        onClick={() => execRemove({ appointmentProductId: s.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Totale: e' la cifra che si dice al cliente, quindi e' la piu' marcata della pagina. */}
      <section className="flex flex-col gap-2 rounded-lg border border-brand-primary bg-brand-primary/5 p-5">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Servizio</span>
          <span className="tabular-nums">{formatPrice(appointment.price)}</span>
        </div>
        {soldProducts.length > 0 && (
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Prodotti</span>
            <span className="tabular-nums">{formatPrice(totalProducts)}</span>
          </div>
        )}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <span className="text-sm font-medium text-foreground">Totale</span>
          <span className="text-2xl font-semibold text-foreground tabular-nums">
            {formatPrice(grandTotal)}
          </span>
        </div>
      </section>
    </div>
  )
}
