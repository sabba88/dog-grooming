import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
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
