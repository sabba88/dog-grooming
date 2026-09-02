'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, UserPlus, Loader2 } from 'lucide-react'

interface ClientDogResult {
  clientId: string
  nominativo: string
  phone: string
  dogId: string | null
  dogName: string | null
  breedName: string | null
}

interface ClientDogSearchProps {
  onSelect: (result: { client: { id: string; nominativo: string }; dog: { id: string; name: string } | null }) => void
  onCreateNew: () => void
  autoFocus?: boolean
}

export function ClientDogSearch({ onSelect, onCreateNew, autoFocus = true }: ClientDogSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientDogResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
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
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      setIsOpen(false)
    }
  }

  const handleSelect = (result: ClientDogResult) => {
    onSelect({
      client: { id: result.clientId, nominativo: result.nominativo },
      dog: result.dogId && result.dogName ? { id: result.dogId, name: result.dogName } : null,
    })
    setIsOpen(false)
    setQuery('')
  }

  function getInitials(nominativo: string): string {
    const parts = nominativo.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return nominativo.substring(0, 2).toUpperCase()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || query.length >= 2) setIsOpen(true)
          }}
          placeholder="Cerca per cliente, cane o telefono..."
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="border-border bg-popover text-popover-foreground absolute z-50 mt-1 w-full rounded-md border shadow-md"
        >
          {results.length === 0 && !isLoading && (
            <div className="text-muted-foreground p-3 text-center text-sm">
              Nessun risultato
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={`${result.clientId}-${result.dogId ?? 'none'}`}
                type="button"
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
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
                </div>
              </button>
            ))}
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
        </div>
      )}
    </div>
  )
}
