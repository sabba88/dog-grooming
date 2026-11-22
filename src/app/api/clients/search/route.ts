import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { searchClientsWithDogs, SEARCH_MIN_CHARS } from '@/lib/queries/clients'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })
  }

  // Tre filtri separati: nome, telefono e cane. Si usano da soli o insieme.
  const nome = request.nextUrl.searchParams.get('nome')?.trim() || ''
  const telefono = request.nextUrl.searchParams.get('telefono')?.trim() || ''
  const cane = request.nextUrl.searchParams.get('cane')?.trim() || ''
  if (
    nome.length < SEARCH_MIN_CHARS &&
    telefono.length < SEARCH_MIN_CHARS &&
    cane.length < SEARCH_MIN_CHARS
  ) {
    return NextResponse.json({ success: true, data: [] })
  }

  const results = await searchClientsWithDogs({ nome, telefono, cane }, session.user.tenantId)

  return NextResponse.json({ success: true, data: results })
}
