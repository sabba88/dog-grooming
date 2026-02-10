import {
  Calendar,
  Users,
  PawPrint,
  Scissors,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth/permissions'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export const mainNavItems: NavItem[] = [
  { label: 'Agenda', href: '/agenda', icon: Calendar, roles: ['admin', 'collaborator'] },
  { label: 'Clienti', href: '/clients', icon: Users, roles: ['admin', 'collaborator'] },
  { label: 'Cani', href: '/dogs', icon: PawPrint, roles: ['admin', 'collaborator'] },
  { label: 'Servizi', href: '/services', icon: Scissors, roles: ['admin', 'collaborator'] },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'collaborator'] },
]

export const footerNavItems: NavItem[] = [
  { label: 'Impostazioni', href: '/settings', icon: Settings, roles: ['admin'] },
]

export const bottomBarItems: NavItem[] = [
  { label: 'Agenda', href: '/agenda', icon: Calendar, roles: ['admin', 'collaborator'] },
  { label: 'Clienti', href: '/clients', icon: Users, roles: ['admin', 'collaborator'] },
  { label: 'Cani', href: '/dogs', icon: PawPrint, roles: ['admin', 'collaborator'] },
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'collaborator'] },
]

export function getVisibleItems(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role))
}

export const pageTitles: Record<string, string> = {
  '/agenda': 'Agenda',
  '/clients': 'Clienti',
  '/dogs': 'Cani',
  '/services': 'Servizi',
  '/dashboard': 'Dashboard',
  '/settings': 'Impostazioni',
  '/settings/users': 'Gestione Utenze',
  '/settings/locations': 'Gestione Sedi',
}
