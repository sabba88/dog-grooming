import Link from 'next/link'
import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/permissions'
import { Users, MapPin } from 'lucide-react'

export default async function SettingsPage() {
  if (!(await checkPermission('manageUsers'))) {
    redirect('/agenda')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Impostazioni</h2>
        <p className="text-muted-foreground mt-1">
          Gestisci le impostazioni del sistema.
        </p>
      </div>
      <nav className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/settings/users"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Gestione Utenze</p>
            <p className="text-sm text-muted-foreground">Crea, modifica e disattiva utenti</p>
          </div>
        </Link>
        <Link
          href="/settings/locations"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Gestione Sedi</p>
            <p className="text-sm text-muted-foreground">Configura le sedi del salone</p>
          </div>
        </Link>
      </nav>
    </div>
  )
}
