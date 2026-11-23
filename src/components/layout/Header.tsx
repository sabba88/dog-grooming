'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocationSelector } from '@/hooks/useLocationSelector'
import { pageTitles } from './nav-items'
import { MapPin } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
}

interface HeaderProps {
  userName: string
  locations: Location[]
}

export function Header({ userName, locations }: HeaderProps) {
  const pathname = usePathname()
  const { selectedLocationId, setSelectedLocationId, isHydrated } =
    useLocationSelector(locations)

  const getPageTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname]
    const matchingPath = Object.keys(pageTitles)
      .sort((a, b) => b.length - a.length)
      .find((path) => pathname.startsWith(path))
    return matchingPath ? pageTitles[matchingPath] : 'Dog Grooming'
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="truncate text-lg font-medium leading-tight text-foreground">
        {getPageTitle()}
      </h1>
      <div className="ml-auto flex items-center gap-3">
        {isHydrated && locations.length > 0 && (
          <div className="flex items-center gap-2">
            <MapPin className="hidden size-4 text-muted-foreground md:block" />
            <Select
              value={selectedLocationId ?? undefined}
              onValueChange={setSelectedLocationId}
            >
              <SelectTrigger size="sm" aria-label="Seleziona sede">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <span className="hidden text-sm text-muted-foreground md:block">
          {userName}
        </span>
      </div>
    </header>
  )
}
