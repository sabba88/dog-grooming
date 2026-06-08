/**
 * Import cani + appuntamenti dal foglio "Registro" di import0505.xlsx
 *
 * Regole di import:
 *  - Salta righe senza servizio (col K vuota)
 *  - Salta "Prodotti" e "Voucher omaggio" (no cane coinvolto)
 *  - Importa importo=0 se mancante (storico incompleto)
 *  - Gatti/conigli: importati normalmente
 *  - VALENTINA CERQUETELLA (3339556670): 4 cani SENZA NOME 1-4 per sessione
 *  - Typo razza: MAREMANO → MAREMMANO
 *  - Typo servizio: Bagne e Snodatura → Bagno e Snodatura
 *  - Servizi mancanti (es. Bagno SPA): creati con prezzo placeholder
 *  - Duplicati (stessa data+client+cane+servizio): si tiene solo il primo
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, clients, dogs, breeds, services, appointments } from './schema'
import * as XLSX from 'xlsx'
import { eq } from 'drizzle-orm'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

// ─── Config ───────────────────────────────────────────────────────────────────

const FILE_PATH = 'src/lib/db/import0505.xlsx'
const SHEET_NAME = 'Registro'
const CONSENT_DATE = new Date('2023-01-01T00:00:00.000Z')
const DEFAULT_START_HOUR_UTC = 8  // 08:00 UTC ≈ 09:00 Roma (ora solare)
const DEFAULT_DURATION_MIN = 60

const VALENTINA_PHONE = '3339556670'

const SKIP_SERVICES = new Set(['Prodotti', 'Voucher omaggio'])

const SERVICE_REMAP: Record<string, string> = {
  'Bagne e Snodatura': 'Bagno e Snodatura',
}

const BREED_REMAP: Record<string, string> = {
  MAREMANO: 'MAREMMANO',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function excelToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400000))
}

function cleanPhone(v: unknown): string | null {
  const s = String(v ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\d+]/g, '')
  return s && s !== '0' ? s : null
}

function clean(v: unknown): string {
  return String(v ?? '').trim()
}

// ─── Row model ────────────────────────────────────────────────────────────────

interface ParsedRow {
  rowNum: number
  date: Date
  collab: string
  dogName: string
  breedName: string
  clientName: string
  phone: string | null
  owner2: string | null
  phone2: string | null
  owner3: string | null
  phone3: string | null
  serviceName: string
  amountCents: number
  notes: string | null
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const wb = XLSX.readFile(FILE_PATH)
  const ws = wb.Sheets[SHEET_NAME]
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: '',
  }) as unknown[][]
  const dataRows = rawRows.slice(1)

  // ── 1. Parse rows ────────────────────────────────────────────────────────────
  const parsedRows: ParsedRow[] = []
  let skippedNoService = 0
  let skippedSpecialService = 0
  let skippedNoDate = 0

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i]
    const rowNum = i + 2

    const dateSerial = r[4]
    if (typeof dateSerial !== 'number') {
      skippedNoDate++
      continue
    }

    const serviceRaw = clean(r[10])
    if (!serviceRaw) {
      skippedNoService++
      continue
    }
    if (SKIP_SERVICES.has(serviceRaw)) {
      skippedSpecialService++
      continue
    }

    const serviceName = SERVICE_REMAP[serviceRaw] ?? serviceRaw
    const amountRaw = r[11]
    const amountCents =
      typeof amountRaw === 'number' ? Math.round(amountRaw * 100) : 0

    const collab = clean(r[5])
    const dogName = clean(r[6])
    const breedRaw = clean(r[7]).toUpperCase()
    const breedName = BREED_REMAP[breedRaw] ?? breedRaw
    const clientName = clean(r[8])
    const phone = cleanPhone(r[9])
    const owner2 = clean(r[14]) || null
    const phone2 = cleanPhone(r[15])
    const owner3 = clean(r[16]) || null
    const phone3 = cleanPhone(r[17])

    const noteParts = [clean(r[12]), clean(r[13])].filter(p => p && p !== '0')
    const notes = noteParts.length ? noteParts.join(' | ') : null

    parsedRows.push({
      rowNum,
      date: excelToDate(dateSerial),
      collab,
      dogName,
      breedName,
      clientName,
      phone,
      owner2,
      phone2,
      owner3,
      phone3,
      serviceName,
      amountCents,
      notes,
    })
  }

  console.log(`\nFoglio: ${SHEET_NAME} — ${dataRows.length} righe totali`)
  console.log(`  Saltate (no data):              ${skippedNoDate}`)
  console.log(`  Saltate (no servizio):          ${skippedNoService}`)
  console.log(`  Saltate (Prodotti/Voucher):     ${skippedSpecialService}`)
  console.log(`  Da processare:                  ${parsedRows.length}`)

  // ── 2. Connessione DB ────────────────────────────────────────────────────────
  const sqlClient = neon(process.env.DATABASE_URL!)
  const db = drizzle(sqlClient)

  const [firstUser] = await db
    .select({ tenantId: users.tenantId })
    .from(users)
    .limit(1)
  if (!firstUser)
    throw new Error(
      'Nessun utente trovato. Esegui prima il seed degli utenti (db:seed-services:dev).'
    )
  const { tenantId } = firstUser
  console.log(`\nTenant: ${tenantId}`)

  // ── 3. Dati di riferimento ───────────────────────────────────────────────────
  const allUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.tenantId, tenantId))
  const userMap = new Map(allUsers.map((u) => [u.name.toLowerCase(), u.id]))

  const allServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.tenantId, tenantId))
  const serviceMap = new Map(
    allServices.map((s) => [s.name.toLowerCase(), s.id])
  )

  const allBreeds = await db
    .select({ id: breeds.id, name: breeds.name })
    .from(breeds)
    .where(eq(breeds.tenantId, tenantId))
  const breedMap = new Map(allBreeds.map((b) => [b.name.toUpperCase(), b.id]))

  const allClients = await db
    .select({ id: clients.id, phone: clients.phone, nominativo: clients.nominativo })
    .from(clients)
    .where(eq(clients.tenantId, tenantId))
  const clientByPhone = new Map(allClients.map((c) => [c.phone, c.id]))
  const clientByName = new Map(
    allClients.map((c) => [c.nominativo.toUpperCase(), c.id])
  )

  const allDogs = await db
    .select({ id: dogs.id, name: dogs.name, clientId: dogs.clientId })
    .from(dogs)
    .where(eq(dogs.tenantId, tenantId))
  const dogByKey = new Map(
    allDogs.map((d) => [`${d.clientId}|${d.name.toUpperCase()}`, d.id])
  )

  // ── 4. Servizi mancanti → crea on the fly ────────────────────────────────────
  const neededServiceNames = new Set(parsedRows.map((r) => r.serviceName))
  const missingSvcNames = [...neededServiceNames].filter(
    (n) => !serviceMap.has(n.toLowerCase())
  )
  if (missingSvcNames.length > 0) {
    console.log(
      `\nServizi non presenti nel DB — creazione: ${missingSvcNames.join(', ')}`
    )
    const newSvcs = missingSvcNames.map((name) => ({
      id: crypto.randomUUID(),
      name,
      price: 2000, // 20 € placeholder in centesimi
      duration: DEFAULT_DURATION_MIN,
      durationSurchargePer30min: 0,
      tenantId,
    }))
    await db.insert(services).values(newSvcs)
    newSvcs.forEach((s) => serviceMap.set(s.name.toLowerCase(), s.id))
  }

  // ── 5. Pre-grouping VALENTINA CERQUETELLA ────────────────────────────────────
  // Ogni sessione (data+servizio) ha 4 righe → cane 1-4 assegnato per posizione
  const valentinaDogIndex = new Map<number, number>() // rowNum → 0-3
  const valentinaGroups = new Map<string, number[]>()
  for (const row of parsedRows) {
    if (row.phone !== VALENTINA_PHONE) continue
    const key = `${row.date.toISOString().slice(0, 10)}|${row.serviceName}`
    if (!valentinaGroups.has(key)) valentinaGroups.set(key, [])
    valentinaGroups.get(key)!.push(row.rowNum)
  }
  for (const rowNums of valentinaGroups.values()) {
    rowNums.forEach((rn, i) => valentinaDogIndex.set(rn, i % 4))
  }

  // ── 6. Clienti ───────────────────────────────────────────────────────────────
  type ClientInsert = typeof clients.$inferInsert
  const clientsToCreate: ClientInsert[] = []
  const localClientByPhone = new Map(clientByPhone)
  const localClientByName = new Map(clientByName)
  const rowClientId = new Map<number, string>()

  for (const row of parsedRows) {
    let clientId: string | undefined

    if (row.phone) clientId = localClientByPhone.get(row.phone)
    if (!clientId && row.clientName)
      clientId = localClientByName.get(row.clientName.toUpperCase())

    if (!clientId) {
      const id = crypto.randomUUID()
      const nominativo = row.clientName || 'SCONOSCIUTO'
      clientsToCreate.push({
        id,
        nominativo,
        phone: row.phone ?? '—',
        owner2: row.owner2,
        phone2: row.phone2,
        owner3: row.owner3,
        phone3: row.phone3,
        email: null,
        consentGivenAt: CONSENT_DATE,
        consentVersion: '1.0',
        tenantId,
      })
      clientId = id
      if (row.phone) localClientByPhone.set(row.phone, id)
      if (row.clientName) localClientByName.set(row.clientName.toUpperCase(), id)
    }

    rowClientId.set(row.rowNum, clientId)
  }

  if (clientsToCreate.length > 0) {
    console.log(`\nCreazione ${clientsToCreate.length} nuovi clienti...`)
    const BATCH = 100
    for (let i = 0; i < clientsToCreate.length; i += BATCH) {
      await db.insert(clients).values(clientsToCreate.slice(i, i + BATCH))
    }
    console.log(`  ✓ ${clientsToCreate.length} clienti inseriti`)
  } else {
    console.log('\nClienti: nessun nuovo cliente da creare')
  }

  // ── 7. Cani + dedup appuntamenti ─────────────────────────────────────────────
  type DogInsert = typeof dogs.$inferInsert
  const dogsToCreate: DogInsert[] = []
  const localDogByKey = new Map(dogByKey)
  const rowDogId = new Map<number, string>()
  const apptSeen = new Map<string, number>() // dedup: apptKey → primo rowNum
  let dupSkipped = 0

  for (const row of parsedRows) {
    const clientId = rowClientId.get(row.rowNum)
    if (!clientId) continue

    // Nome effettivo del cane
    let dogName: string
    if (row.phone === VALENTINA_PHONE) {
      const idx = valentinaDogIndex.get(row.rowNum) ?? 0
      dogName = `SENZA NOME ${idx + 1}`
    } else if (!row.dogName) {
      dogName = row.breedName ? `[${row.breedName}]` : 'SENZA NOME'
    } else {
      dogName = row.dogName
    }

    // Dedup (solo per non-Valentina)
    if (row.phone !== VALENTINA_PHONE) {
      const dateStr = row.date.toISOString().slice(0, 10)
      const apptKey = `${dateStr}|${clientId}|${dogName.toUpperCase()}|${row.serviceName}`
      if (apptSeen.has(apptKey)) {
        dupSkipped++
        continue
      }
      apptSeen.set(apptKey, row.rowNum)
    }

    // Trova o crea il cane
    const breedId = breedMap.get(row.breedName) ?? null
    const dogKey = `${clientId}|${dogName.toUpperCase()}`
    let dogId = localDogByKey.get(dogKey)

    if (!dogId) {
      const id = crypto.randomUUID()
      dogsToCreate.push({
        id,
        name: dogName,
        breedId,
        clientId,
        tenantId,
        sterilized: false,
      })
      dogId = id
      localDogByKey.set(dogKey, id)
    }

    rowDogId.set(row.rowNum, dogId)
  }

  console.log(`\nDuplicati saltati:              ${dupSkipped}`)

  if (dogsToCreate.length > 0) {
    console.log(`Creazione ${dogsToCreate.length} nuovi cani...`)
    const BATCH = 100
    for (let i = 0; i < dogsToCreate.length; i += BATCH) {
      await db.insert(dogs).values(dogsToCreate.slice(i, i + BATCH))
    }
    console.log(`  ✓ ${dogsToCreate.length} cani inseriti`)
  } else {
    console.log('Cani: nessun nuovo cane da creare')
  }

  // ── 8. Appuntamenti ──────────────────────────────────────────────────────────
  type ApptInsert = typeof appointments.$inferInsert
  const apptsToCreate: ApptInsert[] = []
  let warnService = 0
  let warnUser = 0

  for (const row of parsedRows) {
    const dogId = rowDogId.get(row.rowNum)
    if (!dogId) continue // saltato per dedup o nessun cane

    const clientId = rowClientId.get(row.rowNum)
    if (!clientId) continue

    const serviceId = serviceMap.get(row.serviceName.toLowerCase())
    if (!serviceId) {
      warnService++
      continue
    }

    const userId = userMap.get(row.collab.toLowerCase())
    if (!userId) {
      warnUser++
      continue
    }

    const startTime = new Date(row.date)
    startTime.setUTCHours(DEFAULT_START_HOUR_UTC, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + DEFAULT_DURATION_MIN * 60000)

    apptsToCreate.push({
      id: crypto.randomUUID(),
      clientId,
      dogId,
      serviceId,
      userId,
      startTime,
      endTime,
      price: row.amountCents,
      notes: row.notes,
      tenantId,
    })
  }

  if (warnService) console.warn(`  ⚠ Servizi non trovati: ${warnService} righe saltate`)
  if (warnUser) console.warn(`  ⚠ Collaboratori non trovati: ${warnUser} righe saltate`)

  console.log(`\nCreazione ${apptsToCreate.length} appuntamenti...`)
  const BATCH = 100
  let insertedAppts = 0
  for (let i = 0; i < apptsToCreate.length; i += BATCH) {
    await db.insert(appointments).values(apptsToCreate.slice(i, i + BATCH))
    insertedAppts += Math.min(BATCH, apptsToCreate.length - i)
    process.stdout.write(`\r  Inseriti: ${insertedAppts}/${apptsToCreate.length}`)
  }

  // ── 9. Riepilogo ─────────────────────────────────────────────────────────────
  console.log('\n\n╔═══════════════════════════════╗')
  console.log('║  Import completato            ║')
  console.log('╠═══════════════════════════════╣')
  console.log(`║  Clienti creati:   ${String(clientsToCreate.length).padStart(6)}     ║`)
  console.log(`║  Cani creati:      ${String(dogsToCreate.length).padStart(6)}     ║`)
  console.log(`║  Appuntamenti:     ${String(apptsToCreate.length).padStart(6)}     ║`)
  console.log(`║  Duplicati saltati:${String(dupSkipped).padStart(6)}     ║`)
  console.log('╚═══════════════════════════════╝')
}

main().catch(console.error)
