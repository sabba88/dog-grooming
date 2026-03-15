import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { searchClients } from '@/lib/queries/clients'
import { getDogsByClient } from '@/lib/queries/dogs'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q') || ''
  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  const clients = await searchClients(q, session.user.tenantId)

  const enriched = await Promise.all(
    clients.map(async (client) => {
      const dogs = await getDogsByClient(client.id, session.user.tenantId)
      return { ...client, dogsCount: dogs.length }
    })
  )

  return NextResponse.json({ success: true, data: enriched })
}
