import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { breeds, users } from './schema'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config({ path: '.env.local' })

const BREED_NAMES = [
  'AKITA',
  'ALANO',
  'ALASKAN MALAMUTE',
  'AMERICAN BULLY',
  'AMSTAFF',
  'AUSTRALIAN',
  'BARBONCINO',
  'BARBONCINO NANO',
  'BARBONCINO TOY',
  'BARBONE',
  'BASSET',
  'BASSOTTO',
  'BEAGLE',
  'BICHON',
  'BICHON HAVANAIS',
  'BOLOGNESE',
  'BORDER COLLIE',
  'BOVARO',
  'BOXER',
  'BRACCO',
  'BRETON',
  'BULL TERRIER',
  'BULLDOG',
  'BULLDOG INGLESE',
  'CANE LUPO CECOSLOVACCO',
  'CARLINO',
  'CATTLEDOG',
  'CAVALIER KING',
  'CHIWI',
  'CHOW-CHOW',
  'COCKEAPOO',
  'COCKER',
  'CONIGLIO',
  'CORGIE',
  'CORSO',
  'COTON DE TULEAR',
  'DALMATA',
  'FOX',
  'FRENCIE',
  'GATTO',
  'GATTO NORVEGESE',
  'GATTO PELO LUNGO',
  'GATTO PERSIANO',
  'GATTO SIAMESE',
  'GOLDEN',
  'GOLDENOODLE',
  'HUSKY',
  'JACK RUSSELL',
  'LABRADODLE',
  'LABRADOR',
  'LAGOTTO',
  'MAINCOON',
  'MALTESE',
  'MALTIPOO',
  'MAREMMANO',
  'MASTINO NAPOLETANO',
  'METICCIO',
  'MIX',
  'MORKIE',
  'NON DEFINITA',
  'PASTORE AUSTRALIANO KELPIE',
  'PASTORE BELGA',
  'PASTORE SCOZZESE',
  'PASTORE SVIZZERO',
  'PASTORE TEDESCO',
  'PECHINESE',
  'PETIT BASSET GRIFFON VENDEEN',
  'PINCHER',
  'PITBULL',
  'POINTER',
  'ROTTWEILER',
  'SAMOIEDO',
  'SCHIPPERKEE',
  'SCHNAUZER',
  'SCOTTISH',
  'SETTER',
  'SHAR PEI',
  'SHETLAND',
  'SHIBA',
  'SHIHTZU',
  'SPITZ',
  'SPRINGER',
  'STAFFORDSHIRE',
  'TERRANOVA',
  'THOURNESOL PIRENEI',
  'VOLPINO',
  'WAIM',
  'WEST',
  'YORKSHIRE',
]

async function seedBreeds() {
  const sqlClient = neon(process.env.DATABASE_URL!)
  const db = drizzle(sqlClient)

  // Recupera i tenant distinti dagli utenti esistenti
  const rows = await db
    .selectDistinct({ tenantId: users.tenantId })
    .from(users)

  const tenantIds = rows.map((r) => r.tenantId)

  if (tenantIds.length === 0) {
    console.error('Nessun tenant trovato. Esegui prima il seed degli utenti.')
    process.exit(1)
  }

  console.log(`Tenant trovati: ${tenantIds.length}`)
  console.log(
    '⚠️  Questa operazione eliminerà TUTTE le razze esistenti e i relativi prezzi per razza (serviceBreedPrices).'
  )
  console.log(
    '⚠️  I cani che hanno una razza assegnata perderanno il riferimento alla razza (breedId → NULL).'
  )
  console.log('Procedo tra 3 secondi... (Ctrl+C per annullare)\n')

  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Elimina tutte le razze (CASCADE su serviceBreedPrices, SET NULL su dogs.breedId)
  const deleted = await db.delete(breeds).returning({ id: breeds.id })
  console.log(`Razze eliminate: ${deleted.length}`)

  // Inserisce le nuove razze per ogni tenant
  let totalInserted = 0
  for (const tenantId of tenantIds) {
    const rows = BREED_NAMES.map((name) => ({
      id: crypto.randomUUID(),
      name,
      tenantId,
    }))
    await db.insert(breeds).values(rows)
    totalInserted += rows.length
    console.log(`Tenant ${tenantId}: ${rows.length} razze inserite`)
  }

  console.log(`\nSeed completato: ${totalInserted} razze inserite in totale.`)
}

seedBreeds().catch(console.error)
