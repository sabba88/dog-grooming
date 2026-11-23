'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { deleteProduct } from '@/lib/actions/products'
import { formatPrice } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/shop/ProductForm'
import { StockUpdateForm } from '@/components/shop/StockUpdateForm'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface ProductListProps {
  products: Product[]
}

/**
 * Stato della scorta. Il colore non e' mai l'unica cosa che lo dice: sotto soglia
 * il badge ambra porta scritto perche' e' acceso, cosi' si legge anche in bianco e
 * nero o con un daltonismo. Le soglie restano quelle di prima.
 */
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Esaurito</Badge>
  }
  if (stock <= 3) {
    return (
      <Badge
        variant="outline"
        className="border-brand-warning text-brand-warning tabular-nums"
      >
        {stock} pz · scorta bassa
      </Badge>
    )
  }
  return <span className="text-sm text-muted-foreground tabular-nums">{stock} pz</span>
}

export function ProductList({ products }: ProductListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stockTarget, setStockTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const { execute: execDelete, isPending: isDeleting } = useAction(deleteProduct, {
    onSuccess: () => {
      toast.success('Prodotto eliminato')
      setDeleteTarget(null)
      router.refresh()
    },
    onError: (e) => {
      toast.error(e.error?.serverError || 'Errore durante l\'eliminazione')
      setDeleteTarget(null)
    },
  })

  function handleNew() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function handleEdit(p: Product) {
    setEditingProduct(p)
    setFormOpen(true)
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Shop e magazzino</h1>
          {products.length > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {products.length === 1 ? '1 prodotto' : `${products.length} prodotti`}
            </span>
          )}
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo prodotto
        </Button>
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-14 text-center">
          <Package className="mb-1 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nessun prodotto nel magazzino</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Qui stanno i prodotti che vendi in cassa a fine prestazione, con le loro
            scorte.
          </p>
          <Button onClick={handleNew} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi il primo prodotto
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Nome</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Prezzo</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Scorte</TableHead>
                  <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">
                    Azioni
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatPrice(p.price)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StockBadge stock={p.stock} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setStockTarget(p)}>
                          <Package className="h-4 w-4 mr-1" />
                          Scorte
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(p)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="shrink-0 font-semibold text-foreground tabular-nums">
                    {formatPrice(p.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Scorte</span>
                  <StockBadge stock={p.stock} />
                </div>
                <div className="mt-1 flex gap-2 border-t border-border pt-3">
                  <Button variant="outline" size="sm" onClick={() => setStockTarget(p)} className="flex-1">
                    <Package className="h-4 w-4 mr-1" />
                    Scorte
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(p)} className="flex-1">
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(p)}
                    disabled={isDeleting}
                    aria-label={`Elimina ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
        product={editingProduct}
      />

      <StockUpdateForm
        open={!!stockTarget}
        onOpenChange={(open) => !open && setStockTarget(null)}
        onSuccess={handleSuccess}
        product={stockTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Il prodotto verrà rimosso dal magazzino. Lo storico delle vendite non viene alterato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) execDelete({ id: deleteTarget.id }) }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
