import {
  Calendar,
  CalendarPlus,
  Users,
  UserCog,
  PawPrint,
  Scissors,
  LayoutDashboard,
  Settings,
  Dog,
  ShoppingBag,
  MessageSquare,
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
  // Prenotazioni e' la schermata di lavoro quotidiana: viene prima.
  { label: 'Prenotazioni', href: '/bookings', icon: CalendarPlus, roles: ['admin', 'collaborator'] },
  { label: 'Pianificazione', href: '/agenda', icon: Calendar, roles: ['admin', 'collaborator'] },
  { label: 'Clienti', href: '/clients', icon: Users, roles: ['admin', 'collaborator'] },
  // Messaggi lasciati all'assistente vocale: accanto c'e' il numero di quelli da leggere.
  { label: 'Messaggi', href: '/messages', icon: MessageSquare, roles: ['admin', 'collaborator'] },
  { label: 'Cani', href: '/dogs', icon: PawPrint, roles: ['admin', 'collaborator'] },
  { label: 'Servizi', href: '/services', icon: Scissors, roles: ['admin', 'collaborator'] },
  { label: 'Personale', href: '/staff', icon: UserCog, roles: ['admin'] },
  { label: 'Razze', href: '/breeds', icon: Dog, roles: ['admin'] },
  { label: 'Shop', href: '/shop', icon: ShoppingBag, roles: ['admin'] },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'collaborator'] },
]

export const footerNavItems: NavItem[] = [
  { label: 'Impostazioni', href: '/settings', icon: Settings, roles: ['admin'] },
]

export const bottomBarItems: NavItem[] = [
  { label: 'Prenota', href: '/bookings', icon: CalendarPlus, roles: ['admin', 'collaborator'] },
  { label: 'Piano', href: '/agenda', icon: Calendar, roles: ['admin', 'collaborator'] },
  { label: 'Clienti', href: '/clients', icon: Users, roles: ['admin', 'collaborator'] },
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'collaborator'] },
]

export function getVisibleItems(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role))
}

export const pageTitles: Record<string, string> = {
  '/bookings': 'Prenotazioni',
  '/agenda': 'Pianificazione',
  '/clients': 'Clienti',
  '/messages': 'Messaggi dal telefono',
  '/dogs': 'Cani',
  '/services': 'Servizi',
  '/breeds': 'Razze',
  '/shop': 'Shop / Magazzino',
  '/dashboard': 'Dashboard',
  '/settings': 'Impostazioni',
  '/settings/users': 'Gestione Utenze',
  '/settings/locations': 'Gestione Sedi',
  '/staff': 'Gestione Personale',
}
