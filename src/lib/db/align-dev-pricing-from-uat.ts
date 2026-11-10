/**
 * Allinea la configurazione prezzi di DEV a quella di UAT.
 *
 * Su dev pelo e taglia non sono mai stati configurati e la matrice prezzi e' vuota,
 * quindi ogni appuntamento ricade sul prezzo base del servizio e non si riesce a
 * provare il listino per pelo e taglia. Su uat quella configurazione c'e' ed e'
 * quella buona: questo script la ricopia, in una direzione sola.
 *
 * UAT viene solo letto. Si scrive esclusivamente su DEV.
 * Nessuna cancellazione: si aggiorna cio' che combacia e si inserisce cio' che manca,
 * quindi lo script si puo' rilanciare senza fare danni.
 *
 * Le razze si abbinano per nome, ignorando maiuscole e spazi ai bordi: su dev sono
 * scritte tutte maiuscole ("PASTORE TEDESCO"), su uat no ("PASTORE Tedesco"), ed e'
 * la stessa razza. Quelle che su dev hanno un nome davvero diverso (abbreviazioni
 * tipo "WAIM" per "WAIMARANER", o troncature ambigue come "BOVARO", che su uat e'
 * sia del Bernese sia dell'Entlebuch) non vengono toccate: indovinare l'abbinamento
 * significherebbe mettere pelo e taglia sbagliati, e da quelli dipende il prezzo.
 * Lo script le elenca a fine esecuzione, da sistemare a mano.
 *
 *   npx tsx src/lib/db/align-dev-pricing-from-uat.ts
 */
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.dev' })
const DEV_URL = process.env.DATABASE_URL!

dotenv.config({ path: '.env.uat', override: true })
const UAT_URL = process.env.DATABASE_URL!

if (!DEV_URL || !UAT_URL) throw new Error('DATABASE_URL mancante in .env.dev o .env.uat')
if (DEV_URL === UAT_URL) throw new Error('dev e uat puntano allo stesso database: controlla i .env')

const dev = neon(DEV_URL)
const uat = neon(UAT_URL)

async function main() {
  // --- 1. Razze: pelo e taglia, abbinate per nome esatto -------------------
  const uatBreeds = (await uat`
    select name, coat_type, size_type from breeds
    where coat_type is not null or size_type is not null
  `) as { name: string; coat_type: string | null; size_type: string | null }[]

  const devBreeds = (await dev`select id, name from breeds`) as { id: string; name: string }[]
  const chiave = (name: string) => name.trim().toLowerCase()
  const devBreedByName = new Map(devBreeds.map((b) => [chiave(b.name), b.id]))

  let razzeAggiornate = 0
  for (const b of uatBreeds) {
    const id = devBreedByName.get(chiave(b.name))
    if (!id) continue
    await dev`
      update breeds set coat_type = ${b.coat_type}, size_type = ${b.size_type}, updated_at = now()
      where id = ${id}
    `
    razzeAggiornate++
  }
  console.log(`Razze aggiornate su dev: ${razzeAggiornate}`)

  // --- 2. Servizi: prezzo base e durata dei servizi configurati ------------
  // Solo quelli che su uat hanno una matrice: degli altri il prezzo su uat non e'
  // piu' attendibile di quello su dev, e sovrascriverlo non aggiungerebbe nulla.
  const uatServices = (await uat`
    select distinct s.name, s.price, s.duration, s.duration_surcharge_per_30min
    from services s join service_price_matrix m on m.service_id = s.id
  `) as { name: string; price: number; duration: number; duration_surcharge_per_30min: number }[]

  const devServices = (await dev`select id, name, tenant_id from services`) as
    { id: string; name: string; tenant_id: string }[]
  const devServiceByName = new Map(devServices.map((s) => [s.name, s]))

  let serviziAggiornati = 0
  for (const s of uatServices) {
    const target = devServiceByName.get(s.name)
    if (!target) {
      console.log(`  servizio "${s.name}" non esiste su dev: saltato`)
      continue
    }
    await dev`
      update services
         set price = ${s.price},
             duration = ${s.duration},
             duration_surcharge_per_30min = ${s.duration_surcharge_per_30min},
             updated_at = now()
       where id = ${target.id}
    `
    serviziAggiornati++
  }
  console.log(`Servizi aggiornati su dev: ${serviziAggiornati}`)

  // --- 3. Matrice prezzi pelo x taglia -------------------------------------
  const uatMatrix = (await uat`
    select s.name as service_name, m.coat_type, m.size_type, m.price
    from service_price_matrix m join services s on s.id = m.service_id
  `) as { service_name: string; coat_type: string; size_type: string; price: number }[]

  let celleScritte = 0
  for (const cell of uatMatrix) {
    const target = devServiceByName.get(cell.service_name)
    if (!target) continue
    await dev`
      insert into service_price_matrix (service_id, coat_type, size_type, price, tenant_id)
      values (${target.id}, ${cell.coat_type}, ${cell.size_type}, ${cell.price}, ${target.tenant_id})
      on conflict (service_id, coat_type, size_type, tenant_id)
      do update set price = excluded.price, updated_at = now()
    `
    celleScritte++
  }
  console.log(`Celle di matrice scritte su dev: ${celleScritte}`)

  // --- 4. Maggiorazioni ----------------------------------------------------
  const uatSurcharges = (await uat`
    select tenant_id, dimension, value_key, surcharge_percent from pricing_surcharges
  `) as { tenant_id: string; dimension: string; value_key: string; surcharge_percent: number }[]

  for (const s of uatSurcharges) {
    await dev`
      insert into pricing_surcharges (tenant_id, dimension, value_key, surcharge_percent)
      values (${s.tenant_id}, ${s.dimension}, ${s.value_key}, ${s.surcharge_percent})
      on conflict (tenant_id, dimension, value_key)
      do update set surcharge_percent = excluded.surcharge_percent, updated_at = now()
    `
  }
  console.log(`Maggiorazioni allineate: ${uatSurcharges.length}`)

  // --- 5. Cosa resta da sistemare a mano -----------------------------------
  const rimaste = (await dev`
    select b.name, count(d.id)::int as cani
    from breeds b
    left join dogs d on d.breed_id = b.id and d.deleted_at is null
    where b.coat_type is null or b.size_type is null
    group by b.name
    order by cani desc, b.name
  `) as { name: string; cani: number }[]

  console.log(`\nRazze su dev ancora senza pelo o taglia: ${rimaste.length}`)
  for (const r of rimaste) {
    console.log(`  ${r.name} (${r.cani} cani)`)
  }
}

main()
