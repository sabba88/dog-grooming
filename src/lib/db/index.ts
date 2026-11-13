import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })

// Client SQL grezzo, per le poche operazioni che devono stare in una transazione
// (neon-http non fa transazioni interattive: `sqlClient.transaction([...])`).
export const sqlClient = sql
