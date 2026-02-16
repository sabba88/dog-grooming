'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Loader2 } from 'lucide-react'

interface ClientResult {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  dogsCount: number
}

interface ClientSearchProps {
  onSelect: (client: { id: string; firstName: string; lastName: string }) => void
  onCreateNew: () => void
  autoFocus?: boolean
}

export function ClientSearch({ onSelect, onCreateNew, autoFocus = true }: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientResult[]>([])
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

  const handleSelect = (client: ClientResult) => {
    onSelect({ id: client.id, firstName: client.firstName, lastName: client.lastName })
    setIsOpen(false)
    setQuery('')
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
          placeholder="Cerca cliente..."
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

          {results.map((client, index) => (
            <button
              key={client.id}
              type="button"
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => handleSelect(client)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <Avatar size="sm">
                <AvatarFallback className="text-xs">
                  {client.firstName[0]}{client.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {client.firstName} {client.lastName}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {client.phone}
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {client.dogsCount} {client.dogsCount === 1 ? 'cane' : 'cani'}
              </Badge>
            </button>
          ))}

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
