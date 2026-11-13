// Risposte HTTP e accesso per le route dell'assistente vocale (/api/voce/...).
// Stesso contratto dell'assistente della pizzeria:
// - strumenti: header "Authorization: Bearer <VOCE_TOKEN>";
// - webhook di Fish: firma HMAC nell'header X-Fish-Webhook-Signature;
// - risposta 200 con `esito` e `da_dire` (frase pronta da dire al cliente, mai un'istruzione);
// - 500 per un errore interno: per l'assistente vuol dire "passa la chiamata a una persona".
// Se un segreto non è configurato si risponde 500 "configurazione mancante": mai accettare tutto.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

const TOLLERANZA_FIRMA_SECONDI = 5 * 60

export type Risposta = { esito: string; da_dire: string } & Record<string, unknown>

export function rispostaJson(dati: unknown, stato = 200): NextResponse {
  return NextResponse.json(dati, { status: stato })
}

/** Dati mancanti o nel formato sbagliato: 200, e l'assistente legge la domanda da fare. */
export function datiNonValidi(daDire: string, extra: Record<string, unknown> = {}): Risposta {
  return { esito: 'dati_non_validi', da_dire: daDire, ...extra }
}

/** Errore interno: il dettaglio va solo nei log del server, non a chi chiama. */
export function erroreInterno(errore: unknown): NextResponse {
  console.error('[voce]', errore)
  return rispostaJson({ errore: 'errore interno' }, 500)
}

function uguali(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  // timingSafeEqual vuole lunghezze uguali: con lunghezze diverse si confronta comunque
  // qualcosa, così il tempo di risposta non dice quanto è lungo il token giusto.
  if (x.length !== y.length) {
    timingSafeEqual(x, x)
    return false
  }
  return timingSafeEqual(x, y)
}

/** Token degli strumenti. Restituisce la risposta d'errore, o null se va bene. */
export function controllaToken(req: Request): NextResponse | null {
  const atteso = process.env.VOCE_TOKEN
  if (!atteso) return rispostaJson({ errore: 'configurazione mancante' }, 500)
  const ricevuto = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]?.trim() ?? ''
  if (!ricevuto || !uguali(ricevuto, atteso)) return rispostaJson({ errore: 'non autorizzato' }, 401)
  return null
}

/**
 * Firma di un webhook di Fish: header "t=<secondi>,v1=<hex>", dove v1 è l'HMAC-SHA256
 * di "<t>." + corpo grezzo. Va passato il corpo così com'è arrivato, prima del JSON.
 */
export function controllaFirma(req: Request, corpoGrezzo: string, nomeSegreto: string): NextResponse | null {
  const segreto = process.env[nomeSegreto]
  if (!segreto) return rispostaJson({ errore: 'configurazione mancante' }, 500)

  const rifiuta = rispostaJson({ errore: 'firma non valida' }, 401)
  let t = ''
  const firme: string[] = []
  for (const parte of (req.headers.get('x-fish-webhook-signature') ?? '').split(',')) {
    const [chiave, ...resto] = parte.trim().split('=')
    if (chiave === 't') t = resto.join('=')
    if (chiave === 'v1') firme.push(resto.join('=').toLowerCase())
  }
  if (!/^\d+$/.test(t) || firme.length === 0) return rifiuta
  // Una firma vecchia potrebbe essere una richiesta registrata e rimandata: oltre 5 minuti no.
  if (Math.abs(Date.now() / 1000 - Number(t)) > TOLLERANZA_FIRMA_SECONDI) return rifiuta

  const attesa = createHmac('sha256', segreto).update(`${t}.${corpoGrezzo}`).digest('hex')
  let buona = false
  for (const firma of firme) buona = uguali(firma, attesa) || buona
  return buona ? null : rifiuta
}
