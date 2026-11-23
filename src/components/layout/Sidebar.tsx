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
  SidebarMenuBadge,
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
  /** Numeri accanto alle voci di menu, per href (es. messaggi da leggere). Zero non si mostra. */
  badges?: Record<string, number>
}

export function AppSidebar({ userRole, userName, badges = {} }: AppSidebarProps) {
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
      <SidebarHeader className="px-3 py-3.5">
        {!isCollapsed && (
          <span className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Gestionale
          </span>
        )}
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
                          ? 'rounded-l-none border-l-[3px] border-l-primary bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground'
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {(badges[item.href] ?? 0) > 0 && (
                      <SidebarMenuBadge className="bg-primary text-primary-foreground">
                        {badges[item.href]}
                        <span className="sr-only"> da leggere</span>
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div
          className={`mx-2 mb-1 flex items-center justify-center rounded-lg border border-sidebar-border bg-card ${
            isCollapsed ? 'p-1.5' : 'p-3'
          }`}
        >
          <img
            src="/logo-baum-house.webp"
            alt="Baum House"
            className={`object-contain ${isCollapsed ? 'h-8 w-8' : 'h-16 w-auto'}`}
          />
        </div>

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
                          ? 'rounded-l-none border-l-[3px] border-l-primary bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground'
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
            <div className="mb-2 flex flex-col gap-0.5 px-2">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {userRole === 'admin' ? 'Amministratore' : 'Collaboratore'}
              </p>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Esci"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-muted-foreground"
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
