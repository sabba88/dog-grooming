'use client'

import { usePathname } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { pageTitles } from './nav-items'

interface HeaderProps {
  userName: string
}

export function Header({ userName }: HeaderProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname]
    const matchingPath = Object.keys(pageTitles)
      .sort((a, b) => b.length - a.length)
      .find((path) => pathname.startsWith(path))
    return matchingPath ? pageTitles[matchingPath] : 'Dog Grooming'
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-brand-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-lg font-semibold text-brand-text-primary">
        {getPageTitle()}
      </h1>
      <div className="ml-auto flex items-center gap-3">
        {/* Spazio riservato per selettore sede (Epica 2) */}
        <span className="hidden md:block text-sm text-brand-text-secondary">
          {userName}
        </span>
      </div>
    </header>
  )
}
