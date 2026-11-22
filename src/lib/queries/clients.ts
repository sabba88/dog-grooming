import { db } from '@/lib/db'
import { clients, clientNotes, users, dogs, breeds, appointments, services } from '@/lib/db/schema'
import { eq, and, asc, desc, isNull, ilike, or, count, max, min, gt, sql } from 'drizzle-orm'

export interface ClientDogSummary {
  id: string
  name: string
  breedName: string | null
  coatType: string | null
  sizeType: string | null
}

export async function getClients(tenantId: string) {
  const now = new Date()

  const lastAppt = db
    .select({
      clientId: appointments.clientId,
      lastAt: max(appointments.startTime).as('last_at'),
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId)))
    .groupBy(appointments.clientId)
    .as('last_appt')

  const nextAppt = db
    .select({
      clientId: appointments.clientId,
      nextAt: min(appointments.startTime).as('next_at'),
    })
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), gt(appointments.startTime, now)))
    .groupBy(appointments.clientId)
    .as('next_appt')

  return db
    .select({
      id: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      // Proprietari 2 e 3: non si mostrano in elenco, ma vanno nell'export.
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      email: clients.email,
      createdAt: clients.createdAt,
      dogsCount: count(dogs.id),
      dogNames: sql<string>`coalesce(string_agg(${dogs.name}, ', '), '')`,
      dogs: sql<ClientDogSummary[]>`coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', ${dogs.id},
            'name', ${dogs.name},
            'breedName', ${breeds.name},
            'coatType', coalesce(${dogs.coatType}, ${breeds.coatType}),
            'sizeType', coalesce(${dogs.sizeType}, ${breeds.sizeType})
          ) order by ${dogs.name}
        ) filter (where ${dogs.id} is not null), '[]'
      )`,
      lastAppointmentAt: lastAppt.lastAt,
      nextAppointmentAt: nextAppt.nextAt,
    })
    .from(clients)
    .leftJoin(dogs, and(eq(dogs.clientId, clients.id), isNull(dogs.deletedAt)))
    .leftJoin(breeds, eq(dogs.breedId, breeds.id))
    .leftJoin(lastAppt, eq(lastAppt.clientId, clients.id))
    .leftJoin(nextAppt, eq(nextAppt.clientId, clients.id))
    .where(and(eq(clients.tenantId, tenantId), isNull(clients.deletedAt)))
    .groupBy(
      clients.id,
      clients.nominativo,
      clients.phone,
      clients.owner2,
      clients.phone2,
      clients.owner3,
      clients.phone3,
      clients.email,
      clients.createdAt,
      lastAppt.lastAt,
      nextAppt.nextAt,
    )
    .orderBy(asc(clients.nominativo))
}

export async function getClientById(clientId: string, tenantId: string) {
  const [client] = await db
    .select({
      id: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      email: clients.email,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.tenantId, tenantId),
        isNull(clients.deletedAt)
      )
    )
    .limit(1)

  return client ?? null
}

export async function getClientNotes(clientId: string, tenantId: string) {
  return db
    .select({
      id: clientNotes.id,
      content: clientNotes.content,
      createdAt: clientNotes.createdAt,
      authorName: users.name,
    })
    .from(clientNotes)
    .innerJoin(users, eq(clientNotes.authorId, users.id))
    .where(
      and(
        eq(clientNotes.clientId, clientId),
        eq(clientNotes.tenantId, tenantId)
      )
    )
    .orderBy(desc(clientNotes.createdAt))
}

export async function getClientAppointments(clientId: string, tenantId: string) {
  return db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      price: appointments.price,
      notes: appointments.notes,
      dogName: dogs.name,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    // Un appuntamento prenotato ma non ancora pianificato non ha servizio:
    // deve comunque comparire nello storico del cliente.
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(eq(appointments.clientId, clientId), eq(appointments.tenantId, tenantId)))
    .orderBy(desc(appointments.startTime))
}

export interface ClientDogSearchResult {
  clientId: string
  nominativo: string
  phone: string
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
  dogId: string | null
  dogName: string | null
  breedName: string | null
}

/** Metacaratteri POSIX neutralizzati: la ricerca e' testo, non un'espressione regolare. */
function escapeRegex(value: string): string {
  return value.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&')
}

/** Lunghezza minima di un filtro: con una lettera sola uscirebbe mezzo archivio. */
export const SEARCH_MIN_CHARS = 2

/**
 * Ricerca per il form appuntamento e per quello di prenotazione: tre filtri separati,
 * nome del cliente, telefono e nome del cane. Si usano da soli o insieme, e insieme
 * restringono — "Rossi" + "Lola" lascia solo quel cane di quel cliente.
 *
 * Una riga per cane (i clienti senza cani hanno una riga con dogId null), così la
 * selezione precompila cliente + cane in un solo click. Filtrando per cane restano
 * ovviamente solo le righe che un cane ce l'hanno.
 */
export async function searchClientsWithDogs(
  filtri: { nome?: string; telefono?: string; cane?: string },
  tenantId: string
): Promise<ClientDogSearchResult[]> {
  const nome = (filtri.nome ?? '').trim()
  const telefono = (filtri.telefono ?? '').trim()
  const cane = (filtri.cane ?? '').trim()
  // Nessun filtro dice abbastanza: meglio nessun risultato di tutto l'archivio.
  if (
    nome.length < SEARCH_MIN_CHARS &&
    telefono.length < SEARCH_MIN_CHARS &&
    cane.length < SEARCH_MIN_CHARS
  ) {
    return []
  }

  const condizioni = [eq(clients.tenantId, tenantId), isNull(clients.deletedAt)]

  if (nome.length >= SEARCH_MIN_CHARS) {
    // I nomi si cercano per inizio di parola (\m): "ola" non deve far uscire "Lola",
    // ma "rossi" deve far uscire "Mario Rossi". Valgono anche i co-intestatari.
    const namePattern = `\\m${escapeRegex(nome)}`
    const perNome = or(
      sql`${clients.nominativo} ~* ${namePattern}`,
      sql`${clients.owner2} ~* ${namePattern}`,
      sql`${clients.owner3} ~* ${namePattern}`
    )
    if (perNome) condizioni.push(perNome)
  }

  if (telefono.length >= SEARCH_MIN_CHARS) {
    // Il telefono si cerca per frammento: di un numero si ricorda spesso solo un pezzo
    // centrale, e il prefisso puo' essere scritto in tanti modi.
    const phonePattern = `%${telefono}%`
    const perTelefono = or(
      ilike(clients.phone, phonePattern),
      ilike(clients.phone2, phonePattern),
      ilike(clients.phone3, phonePattern)
    )
    if (perTelefono) condizioni.push(perTelefono)
  }

  if (cane.length >= SEARCH_MIN_CHARS) {
    condizioni.push(sql`${dogs.name} ~* ${`\\m${escapeRegex(cane)}`}`)
  }

  // Chi cerca per telefono vuole i numeri vicini fra loro: ordinarli per nominativo
  // li sparpaglierebbe. Negli altri casi resta l'ordine alfabetico.
  const isPhoneQuery = telefono.length >= SEARCH_MIN_CHARS && nome.length < SEARCH_MIN_CHARS

  return db
    .select({
      clientId: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      owner2: clients.owner2,
      phone2: clients.phone2,
      owner3: clients.owner3,
      phone3: clients.phone3,
      dogId: dogs.id,
      dogName: dogs.name,
      breedName: breeds.name,
    })
    .from(clients)
    .leftJoin(dogs, and(eq(dogs.clientId, clients.id), isNull(dogs.deletedAt)))
    .leftJoin(breeds, eq(dogs.breedId, breeds.id))
    .where(and(...condizioni))
    .orderBy(
      ...(isPhoneQuery
        ? [asc(clients.phone), asc(clients.nominativo)]
        : [asc(clients.nominativo)]),
      asc(dogs.name)
    )
    .limit(25)
}
