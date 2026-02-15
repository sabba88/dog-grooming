'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, UserPlus } from 'lucide-react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

interface SearchClient {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
}

interface ClientSearchProps {
  onSelect: (client: SearchClient) => void
  onCreateNew: () => void
}

export function ClientSearch({ onSelect, onCreateNew }: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clients', 'search', debouncedQuery],
    queryFn: () =>
      fetch(`/api/clients/search?q=${encodeURIComponent(debouncedQuery)}`).then(
        (r) => r.json() as Promise<{ clients: SearchClient[] }>
      ),
    enabled: debouncedQuery.length >= 2,
  })

  const showResults = isOpen && debouncedQuery.length >= 2
  const results = data?.clients ?? []

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca cliente..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />
      </div>

      {showResults && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Ricerca...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
                    onClick={() => {
                      onSelect(client)
                      setQuery('')
                      setIsOpen(false)
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(client.firstName, client.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{client.phone}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3">
              <p className="text-sm text-muted-foreground mb-2">Nessun risultato</p>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                onClick={() => {
                  onCreateNew()
                  setQuery('')
                  setIsOpen(false)
                }}
              >
                <UserPlus className="h-4 w-4" />
                Crea nuovo cliente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
