import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/permissions'

export default async function LocationsPage() {
  if (!(await checkPermission('manageLocations'))) {
    redirect('/agenda')
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-xl font-semibold" style={{ color: '#1A202C' }}>
        Gestione Sedi
      </h2>
      <p style={{ color: '#64748B' }}>
        La gestione sedi e postazioni sarà disponibile in Epica 2.
      </p>
    </div>
  )
}
