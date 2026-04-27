/**
 * Seed demo: genera 3 mesi di dati realistici per la dashboard.
 * Crea clienti, cani e appuntamenti distribuiti su Feb–Apr 2026.
 * Prerequisiti: almeno 1 utente e 1 servizio esistente nel tenant.
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, clients, dogs, appointments, services } from './schema'
import { eq } from 'drizzle-orm'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

// ─── Dati fake ────────────────────────────────────────────────────────────────

const NOMINATIVI = [
  'Rossi Marco', 'Ferrari Laura', 'Bianchi Giuseppe', 'Romano Chiara',
  'Ricci Antonio', 'Marino Francesca', 'Greco Luca', 'Bruno Elisa',
  'Gallo Matteo', 'Conti Sara', 'De Luca Roberto', 'Esposito Giovanna',
  'Costa Davide', 'Giordano Elena', 'Mancini Paolo', 'Rizzo Alessia',
  'Lombardi Stefano', 'Moretti Anna', 'Barbieri Michele', 'Fontana Silvia',
  'Coppola Andrea', 'Ferrara Beatrice', 'Marini Giulio', 'Gentile Marta',
  'Riva Leonardo',
]

const DOG_NAMES = [
  'Luna', 'Bella', 'Coco', 'Milo', 'Leo', 'Lola', 'Max', 'Ruby',
  'Charlie', 'Daisy', 'Oscar', 'Molly', 'Buddy', 'Stella', 'Rocky',
  'Lily', 'Bear', 'Nala', 'Zeus', 'Zoe', 'Toby', 'Cleo', 'Rex',
  'Nuvola', 'Briciola', 'Pallino', 'Fiocco', 'Argo', 'Moka', 'Birba',
]

const PHONES = () =>
  `3${String(Math.floor(300_000_000 + Math.random() * 699_999_999))}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Restituisce tutti gli slot da 9:00 a 17:30 ogni 30min per una data (skip domenica). */
function workingSlots(date: Date): Date[] {
  if (date.getDay() === 0) return []
  const slots: Date[] = []
  for (let h = 9; h < 18; h++) {
    for (const m of [0, 30]) {
      const s = new Date(date)
      s.setHours(h, m, 0, 0)
      slots.push(s)
    }
  }
  return slots
}

interface ApptRow {
  id: string
  clientId: string
  dogId: string
  serviceId: string
  userId: string
  stationId: null
  startTime: Date
  endTime: Date
  price: number
  notes: null
  tenantId: string
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedDemo() {
  const sqlClient = neon(process.env.DATABASE_URL!)
  const db = drizzle(sqlClient)

  // 1. Recupera tenant e staff
  const allUsers = await db
    .select({ id: users.id, tenantId: users.tenantId, name: users.name })
    .from(users)
    .limit(20)

  if (allUsers.length === 0) {
    console.error('Nessun utente trovato. Esegui prima il seed base.')
    process.exit(1)
  }
  const tenantId = allUsers[0].tenantId
  const staff = allUsers.filter((u) => u.tenantId === tenantId)
  console.log(`Tenant: ${tenantId}`)
  console.log(`Staff (${staff.length}): ${staff.map((u) => u.name).join(', ')}`)

  // 2. Recupera servizi
  const svcList = await db
    .select({ id: services.id, name: services.name, price: services.price, duration: services.duration })
    .from(services)
    .where(eq(services.tenantId, tenantId))

  if (svcList.length === 0) {
    console.error('Nessun servizio trovato. Aggiungi prima almeno un servizio dal menu Servizi.')
    process.exit(1)
  }
  console.log(`Servizi (${svcList.length}): ${svcList.map((s) => s.name).join(', ')}`)

  // 3. Crea clienti demo
  console.log('\nCreazione clienti e cani...')
  const createdDogs: { id: string; clientId: string }[] = []

  for (const nom of NOMINATIVI) {
    const clientId = crypto.randomUUID()
    await db.insert(clients).values({
      id: clientId,
      nominativo: nom,
      phone: PHONES(),
      email: null,
      consentGivenAt: new Date(2025, 0, 15),
      consentVersion: '1.0',
      tenantId,
    })

    // 1–2 cani per cliente
    const dogCount = Math.random() < 0.35 ? 2 : 1
    for (let j = 0; j < dogCount; j++) {
      const dogId = crypto.randomUUID()
      await db.insert(dogs).values({
        id: dogId,
        name: pick(DOG_NAMES),
        breedId: null,
        size: pick(['small', 'medium', 'large']),
        sex: pick(['M', 'F']),
        sterilized: false,
        clientId,
        tenantId,
      })
      createdDogs.push({ id: dogId, clientId })
    }
  }
  console.log(`Clienti: ${NOMINATIVI.length}, Cani: ${createdDogs.length}`)

  // 4. Genera appuntamenti
  // Distribuzione mensile con trend crescente:
  //   Feb 2026 → ~40 appt  (~€1 400)
  //   Mar 2026 → ~52 appt  (~€1 850)
  //   Apr 2026 → ~60 appt  (past + future per previsione)
  console.log('\nGenerazione appuntamenti...')

  const appts: ApptRow[] = []

  /**
   * Genera `targetCount` appuntamenti casuali nell'intervallo [from, to).
   * `futureFrom`: se valorizzata, gli appuntamenti dopo questa data sono
   * considerati futuri (startTime > now, utile per la colonna "previsione").
   */
  function generateInterval(from: Date, to: Date, targetCount: number) {
    const days: Date[] = []
    const cur = new Date(from)
    while (cur < to) {
      if (cur.getDay() !== 0) days.push(new Date(cur)) // skip domenica
      cur.setDate(cur.getDate() + 1)
    }

    // distribuisce uniformemente aggiungendo rumore ±50%
    const avgPerDay = targetCount / days.length

    for (const day of days) {
      const cnt = Math.max(0, Math.round(avgPerDay * (0.5 + Math.random())))
      const slots = workingSlots(day)
      for (let i = 0; i < Math.min(cnt, slots.length); i++) {
        const slot = pick(slots)
        const svc = pick(svcList)
        const dog = pick(createdDogs)
        const user = pick(staff)
        const endTime = new Date(slot.getTime() + svc.duration * 60 * 1000)

        appts.push({
          id: crypto.randomUUID(),
          clientId: dog.clientId,
          dogId: dog.id,
          serviceId: svc.id,
          userId: user.id,
          stationId: null,
          startTime: slot,
          endTime,
          price: svc.price,
          notes: null,
          tenantId,
        })
      }
    }
  }

  generateInterval(new Date(2026, 1, 1), new Date(2026, 2, 1), 40)   // Feb
  generateInterval(new Date(2026, 2, 1), new Date(2026, 3, 1), 52)   // Mar
  generateInterval(new Date(2026, 3, 1), new Date(2026, 3, 28), 28)  // Apr 1–27 (passati)
  generateInterval(new Date(2026, 3, 28), new Date(2026, 4, 1), 6)   // Apr 28–30 (futuri)
  generateInterval(new Date(2026, 4, 1), new Date(2026, 4, 10), 10)  // Mag 1–9 (futuri prenotati)

  // 5. Inserisce in batch da 50
  const BATCH = 50
  for (let i = 0; i < appts.length; i += BATCH) {
    await db.insert(appointments).values(appts.slice(i, i + BATCH))
  }

  console.log(`Appuntamenti inseriti: ${appts.length}`)
  console.log('\n✓ Seed demo completato!')
  console.log(
    `  Feb: ~${appts.filter(a => a.startTime.getMonth() === 1).length} appt`,
  )
  console.log(
    `  Mar: ~${appts.filter(a => a.startTime.getMonth() === 2).length} appt`,
  )
  console.log(
    `  Apr: ~${appts.filter(a => a.startTime.getMonth() === 3).length} appt`,
  )
  console.log(
    `  Mag: ~${appts.filter(a => a.startTime.getMonth() === 4).length} appt (futuri)`,
  )
}

seedDemo().catch(console.error)
