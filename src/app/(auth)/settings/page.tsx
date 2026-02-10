import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/permissions'

export default async function SettingsPage() {
  if (!(await checkPermission('manageUsers'))) {
    redirect('/agenda')
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-xl font-semibold" style={{ color: '#1A202C' }}>
        Impostazioni
      </h2>
      <p style={{ color: '#64748B' }}>
        Gestisci le impostazioni del sistema.
      </p>
    </div>
  )
}
