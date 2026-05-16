import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { checkPermission } from '@/lib/auth/permissions'
import { getPricingSurcharges } from '@/lib/queries/settings'
import { PricingSurchargesEditor } from '@/components/settings/PricingSurchargesEditor'

export default async function SurchargesPage() {
  if (!(await checkPermission('manageServices'))) {
    redirect('/agenda')
  }

  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const surcharges = await getPricingSurcharges(session.user.tenantId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Tabelle Maggiorazione</h2>
        <p className="text-muted-foreground mt-1">
          Configura le percentuali di maggiorazione per tipo di pelo e taglia.
        </p>
      </div>
      <PricingSurchargesEditor initialSurcharges={surcharges} />
    </div>
  )
}
