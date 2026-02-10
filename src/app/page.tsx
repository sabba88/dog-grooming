import { auth, signOut } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ backgroundColor: '#F8FAFB' }}>
      <h1 className="text-2xl font-semibold" style={{ color: '#1A202C' }}>
        Benvenuto, {session.user?.name}
      </h1>
      <p style={{ color: '#64748B' }}>
        Ruolo: {session.user?.role}
      </p>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/login' })
        }}
      >
        <Button
          type="submit"
          variant="outline"
          className="min-h-[44px]"
        >
          Esci
        </Button>
      </form>
    </div>
  )
}
