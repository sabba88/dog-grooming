import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getPhoneMessages } from '@/lib/queries/phone-messages'
import { PhoneMessageList } from '@/components/phone-message/PhoneMessageList'

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const messages = await getPhoneMessages(session.user.tenantId)

  return <PhoneMessageList messages={messages} />
}
