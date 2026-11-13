// prenota: salva la prenotazione. Prima con conferma_cliente falso (controlla tutto e
// risponde con il riepilogo da ripetere), poi, dopo il sì del cliente, con conferma_cliente vero.
//
// Corpo: giorno, ora, servizio, cane, note, razza, taglia, eta, nome_cliente,
// consenso_dati, telefono_detto, conferma_cliente. Vedi "Cosa chiede l'assistente" nel piano.
// L'appuntamento nasce come una prenotazione del banco: postazione, collaboratore e prezzo
// vuoti, quindi finisce in "Da pianificare"; in più ha source = 'telefono'.

import type { Contesto } from '../contesto'
import { appuntamentiFuturi, prenotaSeCePosto, razze, type CaneTrovato, type ClienteTrovato } from '../dati'
import { appuntamentoStessoGiorno } from '../disponibilita'
import { leggiGiorno, leggiOra, leggiSi, testo } from '../formati'
import { quando } from '../frasi'
import { datiNonValidi, type Risposta } from '../http'
import { cercaPerNome, paroleChiave } from '../nomi'
import { elenco, maiuscola } from '../parole'
import { telefonoNazionale } from '../telefono'
import { chiChiama, controllaDataEOrario, riconosciServizio } from './comune'

/** Taglia detta a voce -> size_type del gestionale. Solo per i meticci (nodo "cosa chiede"). */
const TAGLIE: Record<string, string> = {
  piccola: 'small', piccolo: 'small', small: 'small',
  media: 'medium', medio: 'medium', medium: 'medium',
  grande: 'large', large: 'large',
  gigante: 'giant', giant: 'giant',
  toy: 'toy', nano: 'toy', nana: 'toy',
}

function manca(campo: string, daDire: string): Risposta {
  return { esito: 'manca_dato', manca: campo, da_dire: daDire }
}

export async function prenota(corpo: Record<string, unknown>, ctx: Contesto): Promise<Risposta> {
  const giorno = leggiGiorno(corpo.giorno)
  const ora = leggiOra(corpo.ora)
  const nomeCane = testo(corpo.cane)
  if (!giorno) return datiNonValidi('Per che giorno vuole l\'appuntamento?')
  if (!ora) return datiNonValidi('A che ora le andrebbe bene?')
  if (nomeCane.length < 2) return manca('cane', 'Come si chiama il cane?')

  const r = await riconosciServizio(ctx, testo(corpo.servizio))
  if ('risposta' in r) return r.risposta
  const { servizio } = r

  // ── Chi è il cliente ──
  const telefonoDetto = telefonoNazionale(testo(corpo.telefono_detto))
  const telefono = ctx.telefonoChiamante || telefonoDetto
  if (!telefono) return manca('telefono', 'Il suo numero non mi arriva: mi può dire un numero di telefono?')

  const { clienti, cani } = await chiChiama(ctx, telefono)
  const nomeCliente = testo(corpo.nome_cliente)
  let cliente: ClienteTrovato | null = null
  if (clienti.length === 1) cliente = clienti[0]
  else if (clienti.length > 1) {
    // Più clienti con lo stesso numero (famiglie): si sceglie per nome, o per il cane.
    const perNome = nomeCliente ? cercaPerNome(clienti, nomeCliente, (c) => c.nominativo).trovata : null
    const perCane = cercaPerNome(cani, nomeCane, (c) => c.nome).trovata
    cliente = perNome ?? (perCane ? clienti.find((c) => c.id === perCane.clientId) ?? null : null)
    if (!cliente) {
      return {
        esito: 'cliente_non_chiaro',
        da_dire: 'Con questo numero ho più di un cliente: a che nome metto l\'appuntamento?',
      }
    }
  }

  const nuovoCliente = !cliente
  if (nuovoCliente) {
    if (nomeCliente.length < 2) return manca('nome_cliente', 'A che nome metto l\'appuntamento?')
    // Senza il sì al salvataggio dei dati non si salva niente (nodo 6).
    if (!leggiSi(corpo.consenso_dati)) {
      return manca('consenso_dati', 'Per fissare l\'appuntamento salvo nome, telefono e dati del cane: va bene?')
    }
  }

  // ── Quale cane ──
  const caniDelCliente: CaneTrovato[] = cliente ? cani.filter((c) => c.clientId === cliente.id) : []
  const ricerca = cercaPerNome(caniDelCliente, nomeCane, (c) => c.nome)
  let cane = ricerca.trovata
  if (!cane && ricerca.simili.length > 0) {
    return {
      esito: 'cane_non_chiaro',
      da_dire: `Intende ${elenco(ricerca.simili.map((c) => c.nome))}?`,
      cani: ricerca.simili.map((c) => c.nome),
    }
  }

  const note: string[] = []
  let nuovoCane: { id: string; nome: string; breedId: string | null; sizeType: string | null } | null = null
  if (!cane) {
    // Cane nuovo: razza (o meticcio), taglia se meticcio, età nelle note.
    const razzaDetta = testo(corpo.razza)
    if (!razzaDetta) return manca('razza', `Di che razza è ${nomeCane}?`)
    const meticcio = paroleChiave(razzaDetta).some((p) => p.startsWith('metic') || p === 'incrocio')
    let breedId: string | null = null
    let sizeType: string | null = null
    if (meticcio) {
      sizeType = TAGLIE[paroleChiave(testo(corpo.taglia))[0] ?? ''] ?? null
      if (!sizeType) return manca('taglia', `${maiuscola(nomeCane)} è di taglia piccola, media o grande?`)
      note.push(`Meticcio, taglia detta: ${testo(corpo.taglia)}.`)
    } else {
      const razza = cercaPerNome(await razze(ctx.tenantId), razzaDetta, (b) => b.nome).trovata
      if (razza) breedId = razza.id
      else note.push(`Razza detta al telefono: ${razzaDetta}.`)
    }
    nuovoCane = { id: crypto.randomUUID(), nome: maiuscola(nomeCane), breedId, sizeType }
    cane = { id: nuovoCane.id, nome: nuovoCane.nome, clientId: '', razza: null, coatType: null, sizeType }
  }

  const eta = testo(corpo.eta)
  if (eta) note.push(`Età detta: ${eta}.`)
  const altre = testo(corpo.note)
  if (altre) note.push(altre)

  // ── Già prenotato quel giorno? ── (solo per un cane che c'era già: uno nuovo non ha appuntamenti)
  if (cliente && !nuovoCane) {
    const esistenti = await appuntamentiFuturi(ctx.tenantId, ctx.locationId, [cliente.id], ctx.adesso)
    const doppio = appuntamentoStessoGiorno(esistenti, cane.id, giorno)
    if (doppio) {
      const giaFissato = `${cane.nome} ha già un appuntamento ${quando(doppio.giorno, doppio.ora, ctx)}`
      return {
        esito: 'gia_prenotato',
        da_dire: doppio.ora === ora
          ? `${giaFissato}: è già tutto a posto, non serve prenotarlo di nuovo.`
          : `${giaFissato}. Vuole spostarlo ${quando(giorno, ora, ctx)} o lo lascia com'è?`,
        appuntamento: { giorno: doppio.giorno, ora: doppio.ora, servizio: doppio.servizio },
      }
    }
  }

  // ── Posto ──
  const controllo = await controllaDataEOrario(ctx, giorno, ora, servizio.duration)
  if (!controllo.ok) return controllo.risposta

  const riepilogo = `${servizio.name.toLowerCase()} per ${cane.nome}, ${quando(giorno, ora, ctx)}`
  if (!leggiSi(corpo.conferma_cliente)) {
    return {
      esito: 'riepilogo',
      da_dire: `Allora: ${riepilogo}${nuovoCliente ? `, a nome di ${nomeCliente}` : ''}. Confermo?`,
      cliente_nuovo: nuovoCliente,
      cane_nuovo: nuovoCane !== null,
    }
  }

  const clientId = cliente?.id ?? crypto.randomUUID()
  const esito = await prenotaSeCePosto({
    tenantId: ctx.tenantId,
    locationId: ctx.locationId,
    postazioni: controllo.postazioni,
    giorno,
    ora,
    durata: servizio.duration,
    clientId,
    dogId: cane.id,
    serviceId: servizio.id,
    note: note.length > 0 ? note.join(' ') : null,
    nuovoCliente: nuovoCliente
      ? { id: clientId, nominativo: nomeCliente, telefono, sessionId: ctx.sessionId }
      : null,
    nuovoCane,
  })
  if (!esito.salvata) {
    // Qualcuno ha preso l'ultimo posto fra il controllo e il salvataggio: si ricontrolla.
    const ancora = await controllaDataEOrario(ctx, giorno, ora, servizio.duration)
    return ancora.ok
      ? { esito: 'pieno', da_dire: 'Proprio ora quell\'orario si è riempito. Vuole che le proponga un altro orario?', alternative: [] }
      : ancora.risposta
  }
  return { esito: 'prenotato', da_dire: `Fatto, l'appuntamento è fissato: ${riepilogo}.` }
}
