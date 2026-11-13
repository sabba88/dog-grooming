// Accesso al database per l'assistente vocale. Le letture usano drizzle come il resto del
// gestionale; le due scritture che devono controllare i posti (prenotare, spostare) usano
// una transazione SQL grezza, perché neon-http non fa transazioni interattive.

import { db, sqlClient } from '@/lib/db'
import { appointments, breeds, clients, dogs, phoneMessages, services, servicePriceMatrix } from '@/lib/db/schema'
import { getStationCount } from '@/lib/queries/bookings'
import { getLocationBusinessHours } from '@/lib/queries/locations'
import { getServices } from '@/lib/queries/services'
import { and, asc, eq, gt, gte, ilike, inArray, isNull, lt, ne, or } from 'drizzle-orm'
import { fasceDelGiorno, type Giornata, type OrarioSede } from './disponibilita'
import { aggiungiGiorni, daIstanteNudo, istanteNudo, minuti, timestampSql } from './formati'
import { REGOLE_VOCE } from './regole'
import { codaTelefono, stessoTelefono } from './telefono'

// ─── Clienti e cani ───────────────────────────────────────────────────────────

export interface ClienteTrovato {
  id: string
  nominativo: string
}

/** I clienti (non cancellati) che hanno questo numero come telefono 1, 2 o 3. */
export async function clientiPerTelefono(tenantId: string, telefono: string): Promise<ClienteTrovato[]> {
  const coda = codaTelefono(telefono)
  if (!coda) return []
  // Prima i candidati con le ultime cifre uguali, poi il confronto esatto in codice:
  // nel gestionale i numeri sono scritti in modi diversi ("333…", "+39 333…").
  const pattern = `%${coda}%`
  const righe = await db
    .select({
      id: clients.id,
      nominativo: clients.nominativo,
      phone: clients.phone,
      phone2: clients.phone2,
      phone3: clients.phone3,
    })
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, tenantId),
        isNull(clients.deletedAt),
        or(ilike(clients.phone, pattern), ilike(clients.phone2, pattern), ilike(clients.phone3, pattern))
      )
    )
    .orderBy(asc(clients.nominativo))
  return righe
    .filter((r) => [r.phone, r.phone2, r.phone3].some((p) => stessoTelefono(p, telefono)))
    .map((r) => ({ id: r.id, nominativo: r.nominativo }))
}

export interface CaneTrovato {
  id: string
  nome: string
  clientId: string
  razza: string | null
  coatType: string | null
  sizeType: string | null
}

/** I cani (non cancellati) di uno o più clienti, con pelo e taglia effettivi (cane, poi razza). */
export async function caniDeiClienti(tenantId: string, clientIds: string[]): Promise<CaneTrovato[]> {
  if (clientIds.length === 0) return []
  const righe = await db
    .select({
      id: dogs.id,
      nome: dogs.name,
      clientId: dogs.clientId,
      razza: breeds.name,
      coatType: dogs.coatType,
      sizeType: dogs.sizeType,
      breedCoatType: breeds.coatType,
      breedSizeType: breeds.sizeType,
    })
    .from(dogs)
    .leftJoin(breeds, eq(dogs.breedId, breeds.id))
    .where(and(eq(dogs.tenantId, tenantId), inArray(dogs.clientId, clientIds), isNull(dogs.deletedAt)))
    .orderBy(asc(dogs.name))
  return righe.map((r) => ({
    id: r.id,
    nome: r.nome,
    clientId: r.clientId,
    razza: r.razza,
    coatType: r.coatType || r.breedCoatType || null,
    sizeType: r.sizeType || r.breedSizeType || null,
  }))
}

export async function razze(tenantId: string) {
  return db
    .select({ id: breeds.id, nome: breeds.name, sizeType: breeds.sizeType, coatType: breeds.coatType })
    .from(breeds)
    .where(eq(breeds.tenantId, tenantId))
}

// ─── Servizi e prezzi ─────────────────────────────────────────────────────────

export async function servizi(tenantId: string) {
  return getServices(tenantId)
}

/**
 * Il prezzo da dire come "a partire da" (POC, nodo 8): la cella della matrice per pelo e
 * taglia del cane, se si conoscono; altrimenti la cella più bassa del servizio, o il suo
 * prezzo di base se la matrice è vuota. In centesimi.
 */
export async function prezzoAPartireDa(
  tenantId: string,
  servizio: { id: string; price: number },
  cane: { coatType: string | null; sizeType: string | null } | null
): Promise<number | null> {
  const celle = await db
    .select({ coatType: servicePriceMatrix.coatType, sizeType: servicePriceMatrix.sizeType, price: servicePriceMatrix.price })
    .from(servicePriceMatrix)
    .where(and(eq(servicePriceMatrix.serviceId, servizio.id), eq(servicePriceMatrix.tenantId, tenantId)))
  const credibile = (p: number) => p >= REGOLE_VOCE.prezzoMinimoCredibileCent
  if (cane?.coatType && cane.sizeType) {
    const cella = celle.find((c) => c.coatType === cane.coatType && c.sizeType === cane.sizeType)
    if (cella && credibile(cella.price)) return cella.price
  }
  const prezzi = [...celle.map((c) => c.price), servizio.price].filter(credibile)
  // Senza un prezzo credibile (matrice vuota e prezzo segnaposto) non si dice nessuna cifra.
  return prezzi.length > 0 ? Math.min(...prezzi) : null
}

// ─── Sede e giornate ──────────────────────────────────────────────────────────

export interface Sede {
  orari: OrarioSede[]
  postazioni: number
}

export async function sede(tenantId: string, locationId: string): Promise<Sede> {
  const [orari, postazioni] = await Promise.all([
    getLocationBusinessHours(locationId, tenantId),
    getStationCount(locationId, tenantId),
  ])
  return { orari, postazioni }
}

/**
 * Le giornate da `da` a `a` compresi: fasce di apertura e appuntamenti già presi.
 * Come la griglia a video, contano gli appuntamenti dei clienti non cancellati.
 * `escludi` toglie un appuntamento (quello che si sta spostando).
 */
export async function giornate(
  tenantId: string,
  locationId: string,
  orari: OrarioSede[],
  da: string,
  a: string,
  escludi?: string
): Promise<(giorno: string) => Giornata> {
  const righe = await db
    .select({ startTime: appointments.startTime, endTime: appointments.endTime })
    .from(appointments)
    .innerJoin(clients, and(eq(appointments.clientId, clients.id), isNull(clients.deletedAt)))
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        eq(appointments.locationId, locationId),
        gte(appointments.startTime, istanteNudo(da, '00:00')),
        lt(appointments.startTime, istanteNudo(aggiungiGiorni(a, 1), '00:00')),
        ...(escludi ? [ne(appointments.id, escludi)] : [])
      )
    )
  const perGiorno = new Map<string, { inizio: number; fine: number }[]>()
  for (const r of righe) {
    const inizio = daIstanteNudo(r.startTime)
    const fine = daIstanteNudo(r.endTime)
    const lista = perGiorno.get(inizio.giorno) ?? []
    // Un appuntamento che finisce dopo mezzanotte (non dovrebbe capitare) occupa fino a fine giornata.
    lista.push({ inizio: minuti(inizio.ora), fine: fine.giorno === inizio.giorno ? minuti(fine.ora) : 24 * 60 })
    perGiorno.set(inizio.giorno, lista)
  }
  return (giorno: string) => ({ fasce: fasceDelGiorno(orari, giorno), appuntamenti: perGiorno.get(giorno) ?? [] })
}

// ─── Appuntamenti dei clienti ─────────────────────────────────────────────────

export interface AppuntamentoFuturo {
  id: string
  giorno: string
  ora: string
  durata: number
  dogId: string
  cane: string
  servizio: string | null
  pianificato: boolean
}

/** Gli appuntamenti futuri di questi clienti nella sede, dal più vicino. */
export async function appuntamentiFuturi(
  tenantId: string,
  locationId: string,
  clientIds: string[],
  adesso: { giorno: string; ora: string }
): Promise<AppuntamentoFuturo[]> {
  if (clientIds.length === 0) return []
  const righe = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      dogId: appointments.dogId,
      cane: dogs.name,
      servizio: services.name,
      stationId: appointments.stationId,
      userId: appointments.userId,
    })
    .from(appointments)
    .innerJoin(dogs, eq(appointments.dogId, dogs.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        eq(appointments.locationId, locationId),
        inArray(appointments.clientId, clientIds),
        gt(appointments.startTime, istanteNudo(adesso.giorno, adesso.ora)),
        isNull(appointments.closedAt)
      )
    )
    .orderBy(asc(appointments.startTime))
  return righe.map((r) => {
    const { giorno, ora } = daIstanteNudo(r.startTime)
    return {
      id: r.id,
      giorno,
      ora,
      durata: Math.round((r.endTime.getTime() - r.startTime.getTime()) / 60_000),
      dogId: r.dogId,
      cane: r.cane,
      servizio: r.servizio,
      pianificato: r.stationId !== null || r.userId !== null,
    }
  })
}

// ─── Scritture con controllo dei posti ────────────────────────────────────────
//
// Il controllo e il salvataggio stanno nella stessa transazione, dietro un lock sulla sede
// (pg_advisory_xact_lock): due chiamate insieme non possono prendere lo stesso ultimo posto.
// In READ COMMITTED ogni istruzione vede quello che è già confermato, quindi la seconda
// chiamata, dopo aver aspettato il lock, conta anche l'appuntamento della prima.

export interface NuovoCliente {
  id: string
  nominativo: string
  telefono: string
  sessionId: string
}

export interface NuovoCane {
  id: string
  nome: string
  breedId: string | null
  sizeType: string | null
}

/** Salva la prenotazione (e cliente e cane nuovi) solo se c'è ancora posto. true se salvata. */
export async function prenotaSeCePosto(p: {
  tenantId: string
  locationId: string
  postazioni: number
  giorno: string
  ora: string
  durata: number
  clientId: string
  dogId: string
  serviceId: string
  note: string | null
  nuovoCliente: NuovoCliente | null
  nuovoCane: NuovoCane | null
}): Promise<{ salvata: boolean; id: string }> {
  const id = crypto.randomUUID()
  const inizio = timestampSql(p.giorno, p.ora)
  const fineIstante = new Date(istanteNudo(p.giorno, p.ora).getTime() + p.durata * 60_000)
  const fine = timestampSql(daIstanteNudo(fineIstante).giorno, daIstanteNudo(fineIstante).ora)

  const query = [
    sqlClient`SELECT pg_advisory_xact_lock(hashtext(${p.tenantId} || ':' || ${p.locationId}))`,
    sqlClient`
      INSERT INTO appointments (id, client_id, dog_id, location_id, service_id, start_time, end_time, notes, source, tenant_id)
      SELECT ${id}::uuid, ${p.clientId}::uuid, ${p.dogId}::uuid, ${p.locationId}::uuid, ${p.serviceId}::uuid,
             ${inizio}::timestamp, ${fine}::timestamp, ${p.note}, 'telefono', ${p.tenantId}::uuid
      WHERE (
        SELECT coalesce(max(occupati), 0) FROM (
          SELECT (
            SELECT count(*) FROM appointments a
              JOIN clients c ON c.id = a.client_id AND c.deleted_at IS NULL
             WHERE a.tenant_id = ${p.tenantId}::uuid AND a.location_id = ${p.locationId}::uuid
               AND a.start_time <= m.t AND a.end_time > m.t
          ) AS occupati
          FROM (
            SELECT ${inizio}::timestamp AS t
            UNION
            SELECT a.start_time FROM appointments a
             WHERE a.tenant_id = ${p.tenantId}::uuid AND a.location_id = ${p.locationId}::uuid
               AND a.start_time > ${inizio}::timestamp AND a.start_time < ${fine}::timestamp
          ) m
        ) x
      ) < ${p.postazioni}
      RETURNING id`,
  ]
  // Cliente e cane nuovi si salvano solo se l'appuntamento è stato salvato: niente schede orfane.
  if (p.nuovoCliente) {
    const c = p.nuovoCliente
    query.push(sqlClient`
      INSERT INTO clients (id, nominativo, phone, consent_given_at, consent_version, consent_session_id, tenant_id)
      SELECT ${c.id}::uuid, ${c.nominativo}, ${c.telefono}, now(), ${REGOLE_VOCE.versioneConsenso}, ${c.sessionId || null}, ${p.tenantId}::uuid
      WHERE EXISTS (SELECT 1 FROM appointments WHERE id = ${id}::uuid)`)
  }
  if (p.nuovoCane) {
    const d = p.nuovoCane
    query.push(sqlClient`
      INSERT INTO dogs (id, name, breed_id, size_type, client_id, tenant_id)
      SELECT ${d.id}::uuid, ${d.nome}, ${d.breedId}::uuid, ${d.sizeType}, ${p.clientId}::uuid, ${p.tenantId}::uuid
      WHERE EXISTS (SELECT 1 FROM appointments WHERE id = ${id}::uuid)`)
  }
  const risultati = await sqlClient.transaction(query)
  return { salvata: (risultati[1] as unknown[]).length === 1, id }
}

/**
 * Sposta un appuntamento solo se al nuovo orario c'è posto (l'appuntamento stesso non conta).
 * Postazione e collaboratore si tolgono: torna "da pianificare" (POC, nodo 7).
 */
export async function spostaSeCePosto(p: {
  tenantId: string
  locationId: string
  postazioni: number
  id: string
  giorno: string
  ora: string
  durata: number
}): Promise<boolean> {
  const inizio = timestampSql(p.giorno, p.ora)
  const fineIstante = new Date(istanteNudo(p.giorno, p.ora).getTime() + p.durata * 60_000)
  const fine = timestampSql(daIstanteNudo(fineIstante).giorno, daIstanteNudo(fineIstante).ora)

  const risultati = await sqlClient.transaction([
    sqlClient`SELECT pg_advisory_xact_lock(hashtext(${p.tenantId} || ':' || ${p.locationId}))`,
    sqlClient`
      UPDATE appointments
         SET start_time = ${inizio}::timestamp, end_time = ${fine}::timestamp,
             station_id = NULL, user_id = NULL, phone_changed_at = now(), updated_at = now()
       WHERE id = ${p.id}::uuid AND tenant_id = ${p.tenantId}::uuid AND (
         SELECT coalesce(max(occupati), 0) FROM (
           SELECT (
             SELECT count(*) FROM appointments a
               JOIN clients c ON c.id = a.client_id AND c.deleted_at IS NULL
              WHERE a.tenant_id = ${p.tenantId}::uuid AND a.location_id = ${p.locationId}::uuid
                AND a.id <> ${p.id}::uuid
                AND a.start_time <= m.t AND a.end_time > m.t
           ) AS occupati
           FROM (
             SELECT ${inizio}::timestamp AS t
             UNION
             SELECT a.start_time FROM appointments a
              WHERE a.tenant_id = ${p.tenantId}::uuid AND a.location_id = ${p.locationId}::uuid
                AND a.id <> ${p.id}::uuid
                AND a.start_time > ${inizio}::timestamp AND a.start_time < ${fine}::timestamp
           ) m
         ) x
       ) < ${p.postazioni}
      RETURNING id`,
  ])
  return (risultati[1] as unknown[]).length === 1
}

// ─── Messaggi ─────────────────────────────────────────────────────────────────

export async function salvaMessaggio(m: {
  tenantId: string
  locationId: string
  clientId: string | null
  nome: string
  telefono: string
  messaggio: string
  sessionId: string
}) {
  await db.insert(phoneMessages).values({
    tenantId: m.tenantId,
    locationId: m.locationId,
    clientId: m.clientId,
    name: m.nome || null,
    phone: m.telefono || null,
    message: m.messaggio,
    sessionId: m.sessionId || null,
  })
}
