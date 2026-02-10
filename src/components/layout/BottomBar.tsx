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
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
      }}
    >
      {visibleItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            style={{
              minHeight: '64px',
              minWidth: '44px',
              color: active ? '#4A7C6F' : '#94A3B8',
            }}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
