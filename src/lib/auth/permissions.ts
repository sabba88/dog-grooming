import { auth } from './auth'

export type UserRole = 'admin' | 'collaborator'

export async function checkRole(...allowedRoles: UserRole[]): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.role) return false
  return allowedRoles.includes(session.user.role as UserRole)
}

export const permissions = {
  manageUsers: ['admin'] as UserRole[],
  manageServices: ['admin'] as UserRole[],
  manageLocations: ['admin'] as UserRole[],
  viewAgenda: ['admin', 'collaborator'] as UserRole[],
  manageAppointments: ['admin', 'collaborator'] as UserRole[],
  viewDashboard: ['admin'] as UserRole[],
} as const

// Route admin-only: collaboratore viene rediretto a /agenda
export const adminOnlyRoutes = [
  '/settings',
  '/settings/users',
  '/settings/locations',
]

export function isAdminOnlyRoute(pathname: string): boolean {
  return adminOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}
