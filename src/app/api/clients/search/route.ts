import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { searchClients } from '@/lib/queries/clients'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ clients: [] }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q') || ''
  if (q.length < 2) {
    return NextResponse.json({ clients: [] })
  }

  const results = await searchClients(q, session.user.tenantId)
  return NextResponse.json({ clients: results })
}
