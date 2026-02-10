import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/permissions'

export default async function UsersPage() {
  if (!(await checkPermission('manageUsers'))) {
    redirect('/agenda')
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-xl font-semibold" style={{ color: '#1A202C' }}>
        Gestione Utenze
      </h2>
      <p style={{ color: '#64748B' }}>
        La gestione utenze sarà disponibile in Story 1.3.
      </p>
    </div>
  )
}
