'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Dog, Phone, Search, UserPlus, Loader2 } from 'lucide-react'
import { getCoOwners } from '@/lib/utils/formatting'

interface ClientDogResult {
  clientId: string
  nominativo: string
  phone: string
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
  dogId: string | null
  dogName: string | null
  breedName: string | null
}

interface ClientDogSearchProps {
  onSelect: (result: { client: { id: string; nominativo: string }; dog: { id: string; name: string } | null }) => void
  onCreateNew: () => void
  autoFocus?: boolean
}

/** Sotto i due caratteri non si cerca: deve combaciare con l'API. */
const MIN_CHARS = 2

export function ClientDogSearch({ onSelect, onCreateNew, autoFocus = true }: ClientDogSearchProps) {
  // Tre filtri separati invece di un campo unico: al telefono si ha in mano il nome,
  // il numero o il nome del cane, spesso piu' d'uno, e insieme restringono.
  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cane, setCane] = useState('')
  const [results, setResults] = useState<ClientDogResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Basta che uno dei filtri sia abbastanza lungo: gli altri, se ci sono, restringono.
  const canSearch =
    nome.trim().length >= MIN_CHARS ||
    telefono.trim().length >= MIN_CHARS ||
    cane.trim().length >= MIN_CHARS

  useEffect(() => {
    if (!canSearch) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (nome.trim()) params.set('nome', nome.trim())
        if (telefono.trim()) params.set('telefono', telefono.trim())
        if (cane.trim()) params.set('cane', cane.trim())
        const res = await fetch(`/api/clients/search?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setResults(json.data)
          setIsOpen(true)
          setActiveIndex(-1)
        }
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [nome, telefono, cane, canSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const totalItems = results.length + 1 // +1 for "Crea nuovo cliente"

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex])
      } else if (activeIndex === results.length) {
        onCreateNew()
        setIsOpen(false)
      } else if (results.length > 0) {
        handleSelect(results[0])
      }
    } else if (e.key === 'Escape') {
      // Senza stopPropagation l'Esc che chiude la tendina chiuderebbe anche il
      // dialog che contiene la ricerca.
      e.stopPropagation()
      setIsOpen(false)
    }
  }

  // Tornando su un campo si rivede la tendina gia' popolata, senza ridigitare.
  const handleFocus = () => {
    if (results.length > 0 || canSearch) setIsOpen(true)
  }

  const handleSelect = (result: ClientDogResult) => {
    onSelect({
      client: { id: result.clientId, nominativo: result.nominativo },
      dog: result.dogId && result.dogName ? { id: result.dogId, name: result.dogName } : null,
    })
    setIsOpen(false)
    setNome('')
    setTelefono('')
    setCane('')
  }

  function getInitials(nominativo: string): string {
    const parts = nominativo.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return nominativo.substring(0, 2).toUpperCase()
  }

  return (
    // La tendina passa dal Popover (portale sul body) e non da un div assoluto:
    // dentro al dialog, che e' scorrevole e quindi ritaglia il proprio
    // contenuto, un div assoluto resta tagliato al bordo del riquadro.
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        {/* Nome e telefono affiancati, il cane sotto a tutta larghezza: tre campi in
            fila starebbero troppo stretti nella scheda, che e' larga come un dialog.
            Su schermo stretto vanno comunque uno sotto l'altro. */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" ref={anchorRef}>
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder="Nome cliente"
              aria-label="Cerca per nome del cliente"
              className="pl-9 pr-9"
            />
            {isLoading && (
              <Loader2 className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
            )}
          </div>

          <div className="relative">
            <Phone className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              inputMode="tel"
              placeholder="Telefono"
              aria-label="Cerca per numero di telefono"
              className="pl-9"
            />
          </div>

          <div className="relative sm:col-span-2">
            <Dog className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={cane}
              onChange={(e) => setCane(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder="Nome del cane"
              aria-label="Cerca per nome del cane"
              className="pl-9"
            />
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={8}
        // Il focus resta nel campo di ricerca: si continua a scrivere e a
        // muoversi con le frecce mentre la tendina e' aperta.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Un click sul campo di ricerca non deve chiudere la tendina.
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
        className="border-border bg-popover text-popover-foreground w-(--radix-popover-trigger-width) overflow-hidden rounded-md border p-0 shadow-md"
      >
        {results.length === 0 && !isLoading && (
          <div className="text-muted-foreground p-3 text-center text-sm">
            Nessun risultato
          </div>
        )}

        <div className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3rem))] overflow-y-auto overscroll-contain">
          {results.map((result, index) => {
            const coOwners = getCoOwners(result)
            return (
              <button
                key={`${result.clientId}-${result.dogId ?? 'none'}`}
                type="button"
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  index === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">
                    {getInitials(result.nominativo)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {result.dogName
                      ? `${result.dogName}${result.breedName ? ` (${result.breedName})` : ''}`
                      : result.nominativo}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {result.dogName ? `${result.nominativo} · ${result.phone}` : `${result.phone} · Nessun cane`}
                  </div>
                  {coOwners.length > 0 && (
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {coOwners.map((owner, i) => (
                        <div key={owner.slot} className="flex gap-1">
                          <span className="w-5 shrink-0 tabular-nums">
                            {i === 0 ? `+${coOwners.length}` : ''}
                          </span>
                          <span className="truncate">
                            {owner.name || '—'} · {owner.phone || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className={`border-border flex w-full items-center gap-3 border-t px-3 py-2.5 text-left transition-colors ${
            activeIndex === results.length ? 'bg-accent' : 'hover:bg-accent/50'
          }`}
          onClick={() => {
            onCreateNew()
            setIsOpen(false)
          }}
          onMouseEnter={() => setActiveIndex(results.length)}
        >
          <div className="bg-primary/10 flex size-6 items-center justify-center rounded-full">
            <UserPlus className="text-primary size-3.5" />
          </div>
          <span className="text-primary text-sm font-medium">Crea nuovo cliente</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}
