import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { searchClientsWithDogs } from '@/lib/queries/clients'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q') || ''
  if (q.length < 2) {
    return NextResponse.json({ success: true, data: [] })
  }

  const results = await searchClientsWithDogs(q, session.user.tenantId)

  return NextResponse.json({ success: true, data: results })
}
