import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users, services } from './schema'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

async function seed() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)

  const hashedPassword = await bcrypt.hash('admin123', 10)
  const tenantId = crypto.randomUUID()

  await db.insert(users).values({
    username: 'admin',
    password: hashedPassword,
    name: 'Admin',
    role: 'admin',
    tenantId,
    isActive: true,
  })

  const serviceNames = [
    'Aggiustatura',
    'Bagno',
    'Bagno e Aggiustatura',
    'Bagno e Snodatura',
    'Bagno e Stripping',
    'Bagno e Taglio',
    'Bagno e Taglio e Snodatura',
    'Pulizia orecchie',
    'Snodatura',
    'Spazzolatura',
    'Spazzolatura e Aggiustatura',
    'Stripping',
    'Taglio',
    'Taglio unghie',
  ]

  await db.insert(services).values(
    serviceNames.map((name) => ({ name, price: 20, duration: 60, tenantId }))
  )

  console.log('Seed completato: utente admin creato')
  console.log(`  Username: admin`)
  console.log(`  Password: admin123`)
  console.log(`  Tenant ID: ${tenantId}`)
  console.log(`Seed completato: ${serviceNames.length} servizi creati`)

  const collaborators = [
    { username: 'nicola', name: 'Nicola' },
    { username: 'lisa', name: 'Lisa' },
    { username: 'federica', name: 'Federica' },
  ]

  const collabPassword = await bcrypt.hash('collaboratore123', 10)
  await db.insert(users).values(
    collaborators.map((c) => ({
      username: c.username,
      password: collabPassword,
      name: c.name,
      role: 'collaborator' as const,
      tenantId,
      isActive: true,
    }))
  )

  console.log(`Seed completato: ${collaborators.length} collaboratori creati (password: collaboratore123)`)
}

seed().catch(console.error)
