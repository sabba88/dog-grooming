import { redirect } from 'next/navigation'
import { checkPermission } from '@/lib/auth/permissions'
import { auth } from '@/lib/auth/auth'
import { getUsers } from '@/lib/queries/users'
import { UserList } from '@/components/user/UserList'

export default async function UsersPage() {
  if (!(await checkPermission('manageUsers'))) {
    redirect('/agenda')
  }

  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect('/login')
  }

  const usersList = await getUsers(session.user.tenantId)

  return (
    <UserList
      users={usersList}
      currentUserId={session.user.id!}
    />
  )
}
