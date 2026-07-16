/**
 * Copia integrale dev → UAT.
 *
 * Ordine TRUNCATE (reverse-dep): appointment_products, dog_notes, client_notes,
 *   user_recurring_schedules, user_location_assignments, appointments,
 *   station_services, dogs, stations, location_business_hours,
 *   service_price_matrix, pricing_surcharges, products,
 *   breeds, clients, locations, services, users
 *
 * Ordine INSERT (dep order): inverso del precedente.
 */
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.dev' })
const SOURCE_URL = process.env.DATABASE_URL!

dotenv.config({ path: '.env.uat', override: true })
const TARGET_URL = process.env.DATABASE_URL!

if (!SOURCE_URL || !TARGET_URL) {
  console.error('Mancano DATABASE_URL in .env.dev o .env.uat')
  process.exit(1)
}

const src = neon(SOURCE_URL)
const tgt = neon(TARGET_URL)

// Tabelle nell'ordine corretto per INSERT (le dipendenti vengono dopo)
const TABLE_ORDER = [
  'users',
  'services',
  'locations',
  'breeds',
  'clients',
  'products',
  'stations',
  'station_services',
  'location_business_hours',
  'service_price_matrix',
  'pricing_surcharges',
  'dogs',
  'appointments',
  'client_notes',
  'dog_notes',
  'user_location_assignments',
  'user_recurring_schedules',
  'appointment_products',
]

async function truncateAll() {
  const reverseOrder = [...TABLE_ORDER].reverse()
  for (const table of reverseOrder) {
    await tgt.query(`TRUNCATE TABLE "${table}" CASCADE`)
    process.stdout.write(`  TRUNCATE ${table}\n`)
  }
}

async function copyTable(table: string) {
  const rows = await src.query(`SELECT * FROM "${table}"`)
  if (rows.length === 0) {
    process.stdout.write(`  SKIP   ${table} (vuota)\n`)
    return
  }

  const columns = Object.keys(rows[0])
  const colList = columns.map((c) => `"${c}"`).join(', ')
  const BATCH = 500

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const valuePlaceholders = batch
      .map(
        (_, rowIdx) =>
          `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(', ')})`
      )
      .join(', ')

    const flatValues = batch.flatMap((row) => columns.map((c) => row[c]))

    await tgt.query(
      `INSERT INTO "${table}" (${colList}) VALUES ${valuePlaceholders} ON CONFLICT DO NOTHING`,
      flatValues
    )
  }

  process.stdout.write(`  COPY   ${table} → ${rows.length} righe\n`)
}

async function main() {
  console.log('=== migrate dev → uat ===\n')

  console.log('1. TRUNCATE UAT (reverse order)…')
  await truncateAll()

  console.log('\n2. COPY dev → UAT…')
  for (const table of TABLE_ORDER) {
    await copyTable(table)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
