// Le route dell'assistente vocale: Fish le chiama durante la telefonata.
// Non usano la sessione del gestionale (il middleware le lascia passare): si autenticano
// con il token degli strumenti o con la firma del webhook di Fish. Vedi src/lib/voce/.

import { NextRequest } from 'next/server'
import { ConfigurazioneMancante, creaContesto, type Contesto } from '@/lib/voce/contesto'
import { controllaFirma, controllaToken, datiNonValidi, erroreInterno, rispostaJson, type Risposta } from '@/lib/voce/http'
import { cercaDisponibilita } from '@/lib/voce/strumenti/cerca-disponibilita'
import { chiamataInArrivo } from '@/lib/voce/strumenti/chiamata-in-arrivo'
import { gestisciAppuntamento } from '@/lib/voce/strumenti/gestisci-appuntamento'
import { lasciaMessaggio } from '@/lib/voce/strumenti/lascia-messaggio'
import { prenota } from '@/lib/voce/strumenti/prenota'

export const dynamic = 'force-dynamic'

type Strumento = (corpo: Record<string, unknown>, ctx: Contesto) => Promise<Risposta>

const STRUMENTI: Record<string, Strumento> = {
  'cerca-disponibilita': cercaDisponibilita,
  prenota,
  'gestisci-appuntamento': gestisciAppuntamento,
  'lascia-messaggio': lasciaMessaggio,
}

function leggiOggetto(grezzo: string): Record<string, unknown> | null {
  try {
    const letto = JSON.parse(grezzo)
    return letto && typeof letto === 'object' && !Array.isArray(letto) ? letto : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ strumento: string }> }) {
  const { strumento } = await params
  try {
    // Webhook di inizio chiamata: firma HMAC, numero del chiamante dentro "call".
    if (strumento === 'chiamata-in-arrivo') {
      const grezzo = await req.text()
      const rifiuto = controllaFirma(req, grezzo, 'VOCE_SEGRETO_INIZIO_CHIAMATA')
      if (rifiuto) return rifiuto
      const corpo = leggiOggetto(grezzo) ?? {}
      const chiamata = (corpo.call ?? {}) as Record<string, unknown>
      return rispostaJson(await chiamataInArrivo(creaContesto(chiamata, chiamata.caller_number)))
    }

    const gestisci = STRUMENTI[strumento]
    if (!gestisci) return rispostaJson({ errore: 'strumento sconosciuto' }, 404)
    const rifiuto = controllaToken(req)
    if (rifiuto) return rifiuto

    const corpo = leggiOggetto(await req.text())
    if (!corpo) return rispostaJson(datiNonValidi('Scusi, non ho capito bene: me lo può ripetere?'))
    return rispostaJson(await gestisci(corpo, creaContesto(corpo, corpo.telefono_chiamante)))
  } catch (errore) {
    if (errore instanceof ConfigurazioneMancante) return rispostaJson({ errore: 'configurazione mancante' }, 500)
    return erroreInterno(errore)
  }
}
