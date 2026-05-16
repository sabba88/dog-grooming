export const COAT_TYPES = ['short', 'medium', 'long'] as const
export type CoatType = typeof COAT_TYPES[number]

export const SIZE_TYPES = ['toy', 'small', 'medium', 'large', 'giant'] as const
export type SizeType = typeof SIZE_TYPES[number]

export const COAT_LABELS: Record<CoatType, string> = {
  short: 'Corto',
  medium: 'Medio',
  long: 'Lungo',
}

export const SIZE_LABELS: Record<SizeType, string> = {
  toy: 'Toy',
  small: 'Piccola',
  medium: 'Media',
  large: 'Grande',
  giant: 'Gigante',
}

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
