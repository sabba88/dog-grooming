'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { mainNavItems, footerNavItems, getVisibleItems } from './nav-items'
import type { UserRole } from '@/lib/auth/permissions'

interface AppSidebarProps {
  userRole: UserRole
  userName: string
}

export function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const visibleMainItems = getVisibleItems(mainNavItems, userRole)
  const visibleFooterItems = getVisibleItems(footerNavItems, userRole)

  const isActive = (href: string) => {
    if (href === '/settings') {
      return pathname.startsWith('/settings')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white text-sm font-bold">
            DG
          </div>
          {!isCollapsed && (
            <span className="text-sm font-semibold text-brand-text-primary">
              Dog Grooming
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={
                        active
                          ? 'border-l-[3px] rounded-l-none bg-brand-primary-light text-brand-primary border-l-brand-primary'
                          : 'text-brand-text-secondary'
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {visibleFooterItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarMenu>
              {visibleFooterItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={
                        active
                          ? 'border-l-[3px] rounded-l-none bg-brand-primary-light text-brand-primary border-l-brand-primary'
                          : 'text-brand-text-secondary'
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </>
        )}

        <SidebarSeparator />

        <div className="p-2">
          {!isCollapsed && (
            <div className="mb-2 px-2">
              <p className="text-sm font-medium truncate text-brand-text-primary">
                {userName}
              </p>
              <p className="text-xs capitalize text-brand-text-secondary">
                {userRole === 'admin' ? 'Amministratore' : 'Collaboratore'}
              </p>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Esci"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-brand-text-secondary"
              >
                <LogOut className="shrink-0" />
                <span>Esci</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
