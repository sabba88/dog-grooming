'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { bottomBarItems, getVisibleItems } from './nav-items'
import type { UserRole } from '@/lib/auth/permissions'

interface BottomBarProps {
  userRole: UserRole
}

export function BottomBar({ userRole }: BottomBarProps) {
  const pathname = usePathname()
  const visibleItems = getVisibleItems(bottomBarItems, userRole)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      aria-label="Navigazione principale mobile"
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card shadow-lg md:hidden"
    >
      {visibleItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[64px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 ${
              active ? 'text-accent-foreground' : 'text-muted-foreground'
            }`}
          >
            {/* La voce corrente non si distingue solo per tinta: ha la pastiglia
                dietro all'icona e l'etichetta in grassetto. */}
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full ${
                active ? 'bg-accent' : ''
              }`}
            >
              <item.icon className="size-5" />
            </span>
            <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
