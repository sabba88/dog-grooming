'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Link from 'next/link'

interface BreedComboboxProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  breeds: { id: string; name: string }[]
  isAdmin: boolean
}

export function BreedCombobox({ value, onChange, breeds, isAdmin }: BreedComboboxProps) {
  const [open, setOpen] = useState(false)
  const selectedBreed = breeds.find((b) => b.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedBreed ? selectedBreed.name : 'Seleziona razza...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Cerca razza..." />
          <CommandList>
            {breeds.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nessuna razza configurata
                {isAdmin && (
                  <div className="mt-2">
                    <Link
                      href="/breeds"
                      className="text-primary underline underline-offset-4 hover:no-underline"
                      onClick={() => setOpen(false)}
                    >
                      Aggiungi razze
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <CommandEmpty>Nessun risultato</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => { onChange(null); setOpen(false) }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value ? 'opacity-0' : 'opacity-100')} />
                    Nessuna razza
                  </CommandItem>
                  {breeds.map((breed) => (
                    <CommandItem
                      key={breed.id}
                      value={breed.name}
                      onSelect={() => { onChange(breed.id); setOpen(false) }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === breed.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {breed.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
