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
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/agenda">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Torna all&apos;agenda
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Cassa Appuntamento</h1>
      </div>

      {/* Riepilogo appuntamento */}
      <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          {appointment.clientNominativo} — {appointment.dogName}
        </p>
        <p className="text-sm text-muted-foreground">
          {appointment.serviceName} · {format(new Date(appointment.startTime), "EEE d MMM yyyy", { locale: it })}
        </p>
        <p className="text-sm">
          Servizio: <span className="font-medium">{formatPrice(appointment.price)}</span>
        </p>
      </div>

      {/* Ricerca prodotti */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Aggiungi Prodotti</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cerca prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-border">
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Nessun prodotto trovato</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Disp.</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatPrice(p.price)}</TableCell>
                    <TableCell>
                      {p.stock === 0 ? (
                        <Badge variant="destructive">Esaurito</Badge>
                      ) : (
                        <span className="text-sm">{p.stock}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setQuantities((prev) => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] ?? 1) - 1) }))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{getQty(p.id)}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setQuantities((prev) => ({ ...prev, [p.id]: Math.min(p.stock, (prev[p.id] ?? 1) + 1) }))}
                          disabled={getQty(p.id) >= p.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
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
      </div>

      {/* Prodotti venduti */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Prodotti Venduti</h2>
        {soldProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun prodotto aggiunto</p>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldProducts.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.productName}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{formatPrice(s.priceAtSale)}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(s.priceAtSale * s.quantity)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
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
      </div>

      {/* Totale */}
      <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Servizio</span>
          <span>{formatPrice(appointment.price)}</span>
        </div>
        {soldProducts.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prodotti</span>
            <span>{formatPrice(totalProducts)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t pt-2 mt-1">
          <span>Totale</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}
