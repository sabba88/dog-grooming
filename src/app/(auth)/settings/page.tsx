import Link from 'next/link'
import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/permissions'
import { Users, MapPin, Percent, ChevronRight } from 'lucide-react'

const SECTIONS = [
  {
    href: '/settings/users',
    icon: Users,
    title: 'Gestione Utenze',
    description: 'Crea, modifica e disattiva utenti',
  },
  {
    href: '/settings/locations',
    icon: MapPin,
    title: 'Gestione Sedi',
    description: 'Configura le sedi del salone',
  },
  {
    href: '/settings/surcharges',
    icon: Percent,
    title: 'Tabelle Maggiorazione',
    description: 'Configura % maggiorazione per pelo e taglia',
  },
]

export default async function SettingsPage() {
  if (!(await checkPermission('manageUsers'))) {
    redirect('/bookings')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Impostazioni</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gestisci le impostazioni del sistema.
        </p>
      </div>
      <nav className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-card">
              <Icon className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 ml-auto text-muted-foreground" />
          </Link>
        ))}
      </nav>
    </div>
  )
}
