/**
 * Seed clienti da file Excel.
 * Uso: npm run db:seed-clients:dev [-- percorso/al/file.xlsx]
 * Se non specificato usa il percorso di default sotto.
 *
 * Prerequisiti: almeno 1 utente esistente nel tenant (per ricavare il tenantId).
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, clients } from './schema'
import * as xlsx from 'xlsx'
import dotenv from 'dotenv'
import crypto from 'crypto'
import path from 'path'

dotenv.config({ path: '.env.local' })

const DEFAULT_FILE = 'C:/Users/samueles/Downloads/File Samuele1903.xlsx'
const SHEET_NAME = 'Elenco clienti'
const CONSENT_DATE = new Date('2024-01-01')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (s === '' || s === '(vuoto)' || s.toLowerCase() === 'vuoto') return null
  return s
}

function cleanPhone(value: unknown): string | null {
  const s = clean(value)
  if (!s) return null
  // Rimuove spazi e caratteri non numerici tranne il + iniziale
  return s.replace(/\s+/g, '').replace(/[^\d+]/g, '') || null
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedClients() {
  const filePath = path.resolve(process.argv[2] ?? DEFAULT_FILE)
  console.log(`File: ${filePath}`)

  // 1. Legge il file Excel
  let wb: xlsx.WorkBook
  try {
    wb = xlsx.readFile(filePath)
  } catch {
    console.error(`Impossibile aprire il file: ${filePath}`)
    process.exit(1)
  }

  if (!wb.SheetNames.includes(SHEET_NAME)) {
    console.error(`Foglio "${SHEET_NAME}" non trovato. Fogli disponibili: ${wb.SheetNames.join(', ')}`)
    process.exit(1)
  }

  const ws = wb.Sheets[SHEET_NAME]
  const rows = xlsx.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
  const dataRows = rows.slice(1) // salta intestazione

  // 2. Connessione DB
  const sqlClient = neon(process.env.DATABASE_URL!)
  const db = drizzle(sqlClient)

  // 3. Recupera tenantId dal primo utente
  const [firstUser] = await db.select({ tenantId: users.tenantId }).from(users).limit(1)
  if (!firstUser) {
    console.error('Nessun utente trovato. Esegui prima npm run db:seed:dev.')
    process.exit(1)
  }
  const { tenantId } = firstUser
  console.log(`Tenant: ${tenantId}`)

  // 4. Parsing righe
  const toInsert: (typeof clients.$inferInsert)[] = []
  let skipped = 0

  for (const row of dataRows as unknown[][]) {
    const [p1, t1, p2, t2, p3, t3] = row

    const nominativo = clean(p1)
    if (!nominativo) { skipped++; continue }

    const phone    = cleanPhone(t1) ?? '—'
    const owner2   = clean(p2)
    const phone2   = cleanPhone(t2)
    const owner3   = clean(p3)
    const phone3   = cleanPhone(t3)

    toInsert.push({
      id:               crypto.randomUUID(),
      nominativo,
      phone,
      owner2:           owner2 ?? null,
      phone2:           phone2 ?? null,
      owner3:           owner3 ?? null,
      phone3:           phone3 ?? null,
      email:            null,
      consentGivenAt:   CONSENT_DATE,
      consentVersion:   '1.0',
      tenantId,
    })
  }

  console.log(`Clienti da importare: ${toInsert.length} (scartate ${skipped} righe senza nome)`)

  // 5. Inserimento in batch da 100
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < toInsert.length; i += BATCH) {
    await db.insert(clients).values(toInsert.slice(i, i + BATCH))
    inserted += Math.min(BATCH, toInsert.length - i)
    process.stdout.write(`\r  Inseriti: ${inserted}/${toInsert.length}`)
  }

  console.log(`\n✓ Seed clienti completato — ${inserted} clienti importati.`)
}

seedClients().catch(console.error)
