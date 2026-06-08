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
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Shop / Magazzino</h1>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Prodotto
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nessun prodotto nel magazzino</p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi il primo prodotto
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Scorte</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatPrice(p.price)}</TableCell>
                    <TableCell>
                      {p.stock === 0 ? (
                        <Badge variant="destructive">Esaurito</Badge>
                      ) : p.stock <= 3 ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-400">{p.stock} pz</Badge>
                      ) : (
                        <span className="text-sm">{p.stock} pz</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                          className="text-destructive hover:text-destructive"
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
              <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-foreground">{p.name}</p>
                  {p.stock === 0 ? (
                    <Badge variant="destructive">Esaurito</Badge>
                  ) : p.stock <= 3 ? (
                    <Badge variant="outline" className="text-orange-600 border-orange-400">{p.stock} pz</Badge>
                  ) : (
                    <Badge variant="secondary">{p.stock} pz</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{formatPrice(p.price)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStockTarget(p)} className="flex-1">
                    <Package className="h-4 w-4 mr-1" />
                    Scorte
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(p)} className="flex-1">
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteTarget(p)}
                    disabled={isDeleting}
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
    </>
  )
}
