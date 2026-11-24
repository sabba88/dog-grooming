import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getPhoneMessages } from '@/lib/queries/phone-messages'
import { PhoneMessageList } from '@/components/phone-message/PhoneMessageList'
import { MESSAGGI_TELEFONO_VISIBILI } from '@/lib/feature-flags'

export default async function MessagesPage() {
  // Tolta dal menu, la pagina resta raggiungibile scrivendo l'indirizzo o da un
  // segnalibro vecchio. Rimando alla dashboard invece di un 404: dentro il guscio
  // dell'applicazione il 404 lascia la pagina vuota col menu intorno, e in demo
  // sembra un pezzo rotto invece di un pezzo che non c'e'.
  if (!MESSAGGI_TELEFONO_VISIBILI) redirect('/dashboard')

  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')

  const messages = await getPhoneMessages(session.user.tenantId)

  return <PhoneMessageList messages={messages} />
}
