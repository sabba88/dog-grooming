import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomBar } from '@/components/layout/BottomBar'
import { getLocations } from '@/lib/queries/locations'
import { countUnreadPhoneMessages } from '@/lib/queries/phone-messages'
import type { UserRole } from '@/lib/auth/permissions'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userRole = (session.user.role as UserRole) || 'collaborator'
  const userName = session.user.name || ''
  const [locations, unreadMessages] = session.user.tenantId
    ? await Promise.all([getLocations(session.user.tenantId), countUnreadPhoneMessages(session.user.tenantId)])
    : [[], 0]

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '220px',
          '--sidebar-width-icon': '56px',
        } as React.CSSProperties
      }
    >
      <AppSidebar userRole={userRole} userName={userName} badges={{ '/messages': unreadMessages }} />
      <SidebarInset>
        <Header userName={userName} locations={locations} />
        <main className="flex-1 p-4 pb-20 md:pb-4">
          {children}
        </main>
      </SidebarInset>
      <BottomBar userRole={userRole} />
    </SidebarProvider>
  )
}
