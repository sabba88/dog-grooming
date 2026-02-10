import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from './schema'
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
    email: 'admin@dog-grooming.local',
    password: hashedPassword,
    name: 'Admin',
    role: 'admin',
    tenantId,
    isActive: true,
  })

  console.log('Seed completato: utente admin creato')
  console.log(`  Email: admin@dog-grooming.local`)
  console.log(`  Password: admin123`)
  console.log(`  Tenant ID: ${tenantId}`)
}

seed().catch(console.error)
