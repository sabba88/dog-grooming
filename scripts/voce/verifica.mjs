// Verifica delle route dell'assistente vocale contro un server e il database DEV.
// Crea dati di prova (cliente con telefono 399 000 0001/0002, sessioni "verifica-*") e alla
// fine li cancella. Non va mai lanciata su uat o prod.
//
// Uso: con il server avviato (npx next dev -p 3100), dalla cartella del progetto:
//   node scripts/voce/verifica.mjs [http://localhost:3100]
// Legge VOCE_TOKEN e VOCE_SEGRETO_INIZIO_CHIAMATA da .env.development.local e il
// database da .env.dev, senza stamparli.
//
// Contro un'anteprima Vercel: indirizzo dell'anteprima come argomento, e i segreti di quel
// deploy nelle variabili VERIFICA_TOKEN, VERIFICA_SEGRETO ed eventualmente VERIFICA_BYPASS
// (token "Protection Bypass for Automation"). L'anteprima deve usare il database dev.

import { readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

const BASE = process.argv[2] ?? 'http://localhost:3100'
const leggiEnv = (file) => Object.fromEntries(readFileSync(file, 'utf8').split(/\r?\n/)
  .filter((l) => l.includes('=') && !l.startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const locale = process.env.VERIFICA_TOKEN ? {} : leggiEnv('.env.development.local')
const voce = {
  VOCE_TOKEN: process.env.VERIFICA_TOKEN ?? locale.VOCE_TOKEN,
  VOCE_SEGRETO_INIZIO_CHIAMATA: process.env.VERIFICA_SEGRETO ?? locale.VOCE_SEGRETO_INIZIO_CHIAMATA,
}
// Protezione delle anteprime Vercel: il token di bypass va in un header.
const BYPASS = process.env.VERIFICA_BYPASS ? { 'x-vercel-protection-bypass': process.env.VERIFICA_BYPASS } : {}
const sql = neon(leggiEnv('.env.dev').DATABASE_URL)

const TEL_NUOVO = '+393990000001' // = VOCE_TELEFONO_PROVA
const TEL_ALTRO = '+393990000002'
let passati = 0
let falliti = 0

function verifica(nome, condizione, dettaglio = '') {
  if (condizione) { passati++; console.log(`  ok   ${nome}`) }
  else { falliti++; console.log(`  NO   ${nome} ${dettaglio}`) }
}

async function strumento(nome, corpo, { token = voce.VOCE_TOKEN, telefono = TEL_NUOVO, sessione = 'verifica-1' } = {}) {
  const r = await fetch(`${BASE}/api/voce/${nome}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...BYPASS, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ ...corpo, session_id: sessione, telefono_chiamante: telefono }),
  })
  const dati = await r.json().catch(() => null)
  return { stato: r.status, ...dati }
}

async function inizioChiamata(chiamante, segreto = voce.VOCE_SEGRETO_INIZIO_CHIAMATA) {
  const corpo = JSON.stringify({ event: 'call.inbound', call: { caller_number: chiamante, dialed_number: '+10000000000' } })
  const t = Math.floor(Date.now() / 1000)
  const v1 = createHmac('sha256', segreto).update(`${t}.${corpo}`).digest('hex')
  const r = await fetch(`${BASE}/api/voce/chiamata-in-arrivo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...BYPASS, 'X-Fish-Webhook-Signature': `t=${t},v1=${v1}` }, body: corpo,
  })
  return { stato: r.status, ...(await r.json().catch(() => null)) }
}

// Date relative a oggi (Roma): su dev la sede è aperta dal martedì al sabato.
const oggi = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())
const piu = (g, n) => { const [a, m, d] = g.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10) }
const dow = (g) => (new Date(`${g}T00:00:00Z`).getUTCDay() + 6) % 7 // 0 = lunedì
let martedi = piu(oggi, 2)
while (dow(martedi) !== 1) martedi = piu(martedi, 1)
let lunedi = piu(oggi, 2)
while (dow(lunedi) !== 0) lunedi = piu(lunedi, 1)

async function pulisci() {
  const clienti = await sql`SELECT id FROM clients WHERE phone IN ('3990000001', '3990000002')`
  const ids = clienti.map((c) => c.id)
  if (ids.length > 0) {
    await sql`DELETE FROM appointments WHERE client_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM dogs WHERE client_id = ANY(${ids}::uuid[])`
    await sql`DELETE FROM clients WHERE id = ANY(${ids}::uuid[])`
  }
  await sql`DELETE FROM phone_messages WHERE session_id LIKE 'verifica-%'`
}

await pulisci()
console.log(`Oggi ${oggi}, martedì di prova ${martedi}, lunedì (chiuso) ${lunedi}\n`)

console.log('1. Accesso')
verifica('senza token: 401', (await strumento('cerca-disponibilita', {}, { token: '' })).stato === 401)
verifica('token sbagliato: 401', (await strumento('cerca-disponibilita', {}, { token: 'sbagliato' })).stato === 401)
verifica('strumento sconosciuto: 404', (await strumento('annulla', {})).stato === 404)
verifica('webhook con firma sbagliata: 401', (await inizioChiamata(TEL_NUOVO, 'segreto-sbagliato')).stato === 401)

console.log('\n2. cerca-disponibilita')
let r = await strumento('cerca-disponibilita', { giorno: martedi, ora: '10:00', servizio: 'solo il bagno', cane: '' })
verifica('martedì alle 10 bagno: disponibile', r.esito === 'disponibile', JSON.stringify(r))
verifica('durata = durata del servizio Bagno (60)', r.durata_minuti === 60)
verifica('prezzo solo in prezzo_detto, non in da_dire', /parte da/.test(r.prezzo_detto ?? '') && !/euro/.test(r.da_dire))
r = await strumento('cerca-disponibilita', { giorno: oggi, ora: '10:00', servizio: 'bagno' })
verifica('oggi: data_non_valida con alternative da domani', r.esito === 'data_non_valida' && r.alternative.length > 0 && r.alternative.every((a) => a.giorno > oggi), JSON.stringify(r))
r = await strumento('cerca-disponibilita', { giorno: lunedi, ora: '10:00', servizio: 'bagno' })
verifica('lunedì: chiuso con alternative', r.esito === 'chiuso' && r.alternative.length > 0, JSON.stringify(r))
r = await strumento('cerca-disponibilita', { giorno: martedi, ora: '12:30', servizio: 'bagno' })
verifica("12:30 per un'ora: sfora la pausa, chiuso", r.esito === 'chiuso' && /chiusura/.test(r.da_dire), JSON.stringify(r))
r = await strumento('cerca-disponibilita', { giorno: piu(oggi, 61), ora: '10:00', servizio: 'bagno' })
verifica('oltre 60 giorni: data_non_valida', r.esito === 'data_non_valida', JSON.stringify(r))
r = await strumento('cerca-disponibilita', { giorno: martedi, ora: '10:00', servizio: 'unghie' })
verifica('"unghie": servizio_sconosciuto con Taglio unghie fra i simili', r.esito === 'servizio_sconosciuto' && r.simili.includes('Taglio unghie'), JSON.stringify(r))

console.log('\n3. prenota, cliente nuovo')
const base = { giorno: martedi, ora: '10:00', servizio: 'bagno', cane: 'Luna', note: 'Pulci: no.', razza: '', taglia: '', eta: '', nome_cliente: '', consenso_dati: '', telefono_detto: '', conferma_cliente: false }
r = await strumento('prenota', base)
verifica('senza nome: manca nome_cliente', r.esito === 'manca_dato' && r.manca === 'nome_cliente', JSON.stringify(r))
r = await strumento('prenota', { ...base, nome_cliente: 'Prova Verifica' })
verifica('senza consenso: manca consenso_dati', r.manca === 'consenso_dati', JSON.stringify(r))
r = await strumento('prenota', { ...base, nome_cliente: 'Prova Verifica', consenso_dati: 'sì' })
verifica('cane nuovo senza razza: manca razza', r.manca === 'razza', JSON.stringify(r))
r = await strumento('prenota', { ...base, nome_cliente: 'Prova Verifica', consenso_dati: 'sì', razza: 'meticcio' })
verifica('meticcio senza taglia: manca taglia', r.manca === 'taglia', JSON.stringify(r))
const completo = { ...base, nome_cliente: 'Prova Verifica', consenso_dati: 'sì', razza: 'meticcio', taglia: 'media', eta: '3 anni' }
r = await strumento('prenota', completo)
verifica('conferma falsa: riepilogo', r.esito === 'riepilogo' && /Confermo\?$/.test(r.da_dire), JSON.stringify(r))
verifica('conferma falsa: niente salvato', (await sql`SELECT count(*)::int AS n FROM clients WHERE phone = '3990000001'`)[0].n === 0)
r = await strumento('prenota', { ...completo, conferma_cliente: true })
verifica('conferma vera: prenotato', r.esito === 'prenotato', JSON.stringify(r))
const [cliente] = await sql`SELECT * FROM clients WHERE phone = '3990000001'`
verifica('cliente salvato con telefono senza prefisso e consenso telefono-1.0', cliente?.consent_version === 'telefono-1.0' && cliente?.consent_session_id === 'verifica-1')
const [cane] = await sql`SELECT * FROM dogs WHERE client_id = ${cliente?.id}::uuid`
verifica('cane salvato, meticcio taglia media', cane?.name === 'Luna' && cane?.size_type === 'medium')
// Gli orari si leggono come testo: il driver interpreterebbe il timestamp senza fuso come ora locale del PC.
const [app] = await sql`SELECT a.*, to_char(a.start_time, 'YYYY-MM-DD"T"HH24:MI') AS inizio, to_char(a.end_time, 'YYYY-MM-DD"T"HH24:MI') AS fine, s.name AS servizio FROM appointments a LEFT JOIN services s ON s.id = a.service_id WHERE a.client_id = ${cliente?.id}::uuid`
verifica('appuntamento: 10:00-11:00 "UTC nudo", Bagno, da telefono, da pianificare',
  app && app.inizio === `${martedi}T10:00` && app.fine === `${martedi}T11:00`
  && app.servizio === 'Bagno' && app.source === 'telefono' && app.station_id === null && app.user_id === null && app.price === null,
  JSON.stringify(app))
verifica('note: pulci, meticcio, età', /Pulci: no/.test(app?.notes) && /Età detta: 3 anni/.test(app?.notes) && /Meticcio/.test(app?.notes), app?.notes)

console.log('\n4. Cliente noto e posti')
// Doppioni (13/11/2026): lo stesso cane non si prenota due volte lo stesso giorno.
r = await strumento('prenota', { ...base, cane: 'luna', conferma_cliente: true })
verifica('cane noto ("luna") già prenotato alla stessa ora: gia_prenotato, "già tutto a posto"', r.esito === 'gia_prenotato' && /già tutto a posto/.test(r.da_dire), JSON.stringify(r))
r = await strumento('prenota', { ...base, cane: 'Luna', ora: '15:00', conferma_cliente: false })
verifica('stesso cane, stesso giorno, altra ora: gia_prenotato, propone di spostare', r.esito === 'gia_prenotato' && /spostarlo/.test(r.da_dire), JSON.stringify(r))
verifica('nessun cane doppio', (await sql`SELECT count(*)::int AS n FROM dogs WHERE client_id = ${cliente.id}::uuid`)[0].n === 1)
verifica('nessun appuntamento doppio', (await sql`SELECT count(*)::int AS n FROM appointments WHERE client_id = ${cliente.id}::uuid`)[0].n === 1)
// Per riempire le postazioni servono cani diversi: Rex e Birba, nuovi, dello stesso cliente.
r = await strumento('prenota', { ...base, cane: 'Rex', razza: 'labrador', conferma_cliente: true })
verifica('cliente noto, cane nuovo (Rex) alle 10: prenotato', r.esito === 'prenotato', JSON.stringify(r))
r = await strumento('prenota', { ...base, cane: 'Birba', razza: 'labrador', conferma_cliente: true })
verifica('terzo appuntamento alle 10 (3 postazioni): prenotato', r.esito === 'prenotato', JSON.stringify(r))
r = await strumento('prenota', { ...base, cane: 'Fido', razza: 'labrador', conferma_cliente: true })
verifica('quarto alle 10: pieno con alternative', r.esito === 'pieno' && r.alternative.length > 0, JSON.stringify(r))
r = await strumento('cerca-disponibilita', { giorno: martedi, ora: '10:30', servizio: 'bagno' })
verifica('10:30 si sovrappone ai tre delle 10: pieno', r.esito === 'pieno', JSON.stringify(r))
r = await strumento('cerca-disponibilita', { giorno: martedi, ora: '11:00', servizio: 'bagno' })
verifica('11:00 (i tre finiscono alle 11): disponibile', r.esito === 'disponibile', JSON.stringify(r))

console.log('\n5. Due chiamate insieme sull\'ultimo posto')
// Mercoledì, perché martedì i cani di prova sono già prenotati. Cani diversi, per non incappare nei doppioni.
const mercoledi = piu(martedi, 1)
for (const c of ['Luna', 'Fido']) await strumento('prenota', { ...base, giorno: mercoledi, ora: '15:00', cane: c, razza: 'labrador', conferma_cliente: true })
const insieme = await Promise.all(['Rex', 'Birba'].map((c) => strumento('prenota', { ...base, giorno: mercoledi, ora: '15:00', cane: c, conferma_cliente: true })))
const esiti = insieme.map((x) => x.esito).sort()
verifica('una prenotata e una piena', esiti[0] === 'pieno' && esiti[1] === 'prenotato', JSON.stringify(esiti))
const alle15 = (await sql`SELECT count(*)::int AS n FROM appointments WHERE start_time = ${`${mercoledi} 15:00:00`}::timestamp`)[0].n
verifica('alle 15 ci sono esattamente 3 appuntamenti', alle15 === 3, `trovati ${alle15}`)

console.log('\n6. Inizio chiamata')
r = await inizioChiamata(TEL_NUOVO)
const v = r.dynamic_variables ?? {}
verifica('cliente noto con nome, cani e prossimo appuntamento', v.cliente_noto === 'sì' && v.nome_cliente === 'Prova Verifica' && /Luna/.test(v.cani) && /alle dieci, per (Luna|Rex|Birba), bagno/.test(v.prossimo_appuntamento), JSON.stringify(v))
verifica('orari della sede a parole', /dal martedì al venerdì dalle nove alle tredici/.test(v.orari_sede), v.orari_sede)
r = await inizioChiamata('')
verifica('numero vuoto: usa il numero di prova (solo dev)', r.dynamic_variables?.cliente_noto === 'sì', JSON.stringify(r))
r = await inizioChiamata(TEL_ALTRO)
verifica('numero sconosciuto: cliente_noto no', r.dynamic_variables?.cliente_noto === 'no', JSON.stringify(r))

console.log('\n7. gestisci-appuntamento')
r = await strumento('gestisci-appuntamento', { azione: 'cerca', cane: '', giorno: '', nuovo_giorno: '', nuova_ora: '' })
verifica('cerca: trovati', r.esito === 'trovati' && r.appuntamenti.length === 6, JSON.stringify(r))
r = await strumento('gestisci-appuntamento', { azione: 'sposta', cane: 'Luna', giorno: '', nuovo_giorno: piu(martedi, 2), nuova_ora: '09:00' })
verifica('sposta Luna senza dire il giorno (martedì e mercoledì): scegli', r.esito === 'scegli', JSON.stringify(r))
r = await strumento('gestisci-appuntamento', { azione: 'cerca' }, { telefono: TEL_ALTRO })
verifica('altro numero: nessuno (non vede gli appuntamenti degli altri)', r.esito === 'nessuno', JSON.stringify(r))

// Un appuntamento solo, già pianificato, per provare lo spostamento.
const [unico] = await sql`SELECT a.id FROM appointments a JOIN dogs d ON d.id = a.dog_id WHERE a.client_id = ${cliente.id}::uuid AND d.name = 'Luna' AND a.start_time = ${`${martedi} 10:00:00`}::timestamp LIMIT 1`
await sql`DELETE FROM appointments WHERE client_id = ${cliente.id}::uuid AND id <> ${unico.id}::uuid`
const [postazione] = await sql`SELECT id FROM stations WHERE location_id = ${'64c5019a-b96c-4bb6-8b21-9a634f3d89f5'}::uuid LIMIT 1`
await sql`UPDATE appointments SET station_id = ${postazione.id}::uuid WHERE id = ${unico.id}::uuid`
r = await strumento('gestisci-appuntamento', { azione: 'sposta', cane: 'Luna', giorno: '', nuovo_giorno: lunedi, nuova_ora: '10:00' })
verifica('sposta a lunedì: chiuso', r.esito === 'chiuso', JSON.stringify(r))
r = await strumento('gestisci-appuntamento', { azione: 'sposta', cane: 'Luna', giorno: '', nuovo_giorno: piu(martedi, 1), nuova_ora: '11:30' })
verifica('sposta a mercoledì 11:30: spostato, era pianificato', r.esito === 'spostato' && r.era_pianificato === true, JSON.stringify(r))
const [spostato] = await sql`SELECT *, to_char(start_time, 'YYYY-MM-DD"T"HH24:MI') AS inizio, to_char(end_time, 'YYYY-MM-DD"T"HH24:MI') AS fine FROM appointments WHERE id = ${unico.id}::uuid`
verifica('ora giusta, durata tenuta, postazione tolta, segnato spostato dal telefono',
  spostato.inizio === `${piu(martedi, 1)}T11:30` && spostato.fine === `${piu(martedi, 1)}T12:30`
  && spostato.station_id === null && spostato.phone_changed_at !== null, JSON.stringify(spostato))

console.log('\n8. lascia-messaggio')
r = await strumento('lascia-messaggio', { nome: '', messaggio: 'Vuole annullare il bagno di Luna.', telefono_detto: '' })
verifica('salvato', r.esito === 'salvato', JSON.stringify(r))
const [msg] = await sql`SELECT * FROM phone_messages WHERE session_id = 'verifica-1'`
verifica('messaggio con cliente, nome e telefono', msg?.client_id === cliente.id && msg?.name === 'Prova Verifica' && msg?.phone === '3990000001', JSON.stringify(msg))

// Dal costruttore di Fish il numero arriva vuoto e si usa quello di prova: serve a riconoscere,
// ma non va mai salvato (prova del 13/11/2026). Il numero si chiede a voce.
console.log('\n9. Numero vuoto: il numero di prova non si salva')
const senzaNumero = { telefono: '', sessione: 'verifica-9' }
const nuovoSenzaNumero = { ...base, ora: '16:00', cane: 'Toby', razza: 'labrador', nome_cliente: 'Prova Numero', consenso_dati: 'sì', conferma_cliente: true }
r = await strumento('prenota', nuovoSenzaNumero, senzaNumero)
verifica('prenota senza numero detto: manca telefono', r.esito === 'manca_dato' && r.manca === 'telefono', JSON.stringify(r))
r = await strumento('lascia-messaggio', { nome: 'Prova Numero', messaggio: 'Prova.', telefono_detto: '' }, senzaNumero)
verifica('lascia-messaggio senza numero detto: manca telefono', r.esito === 'manca_dato' && r.manca === 'telefono', JSON.stringify(r))
r = await strumento('prenota', { ...nuovoSenzaNumero, telefono_detto: TEL_ALTRO }, senzaNumero)
verifica('con il numero detto: prenotato', r.esito === 'prenotato', JSON.stringify(r))
verifica('il cliente nuovo ha il numero detto, non quello di prova', (await sql`SELECT count(*)::int AS n FROM clients WHERE phone = '3990000002'`)[0].n === 1)
verifica('sul numero di prova resta un solo cliente', (await sql`SELECT count(*)::int AS n FROM clients WHERE phone = '3990000001'`)[0].n === 1)

await pulisci()
const resti = (await sql`SELECT count(*)::int AS n FROM clients WHERE phone IN ('3990000001', '3990000002')`)[0].n
console.log(`\nPulizia: ${resti === 0 ? 'fatta' : 'RESTANO DATI DI PROVA'}`)
console.log(`\n${passati} passate, ${falliti} fallite`)
process.exit(falliti > 0 ? 1 : 0)
