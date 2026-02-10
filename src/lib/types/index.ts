export type UserRole = 'admin' | 'collaborator'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
