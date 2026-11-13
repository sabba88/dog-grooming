// chiamata-in-arrivo: webhook `conversation_init` di Fish, mentre la chiamata si apre.
// Dice all'assistente chi chiama (nome, cani, prossimo appuntamento) e gli orari della sede,
// letti dal gestionale: così gli orari stanno in un posto solo.
// Deve rispondere in meno di un secondo; se non risponde, l'assistente usa i valori di base.

import type { Contesto } from '../contesto'
import { appuntamentiFuturi, sede } from '../dati'
import { orariInParole, quando } from '../frasi'
import { elenco } from '../parole'
import { chiChiama } from './comune'

export async function chiamataInArrivo(ctx: Contesto) {
  const [{ clienti, cani }, { orari }] = await Promise.all([chiChiama(ctx), sede(ctx.tenantId, ctx.locationId)])
  const prossimi = await appuntamentiFuturi(ctx.tenantId, ctx.locationId, clienti.map((c) => c.id), ctx.adesso)
  const prossimo = prossimi[0]

  const noto = clienti.length > 0
  // Più clienti con lo stesso numero (famiglie): l'assistente chiede il nome.
  const nome = clienti.length === 1 ? clienti[0].nominativo.split(' ')[0] : ''
  return {
    dynamic_variables: {
      cliente_noto: noto ? 'sì' : 'no',
      nome_cliente: clienti.length === 1 ? clienti[0].nominativo : '',
      clienti_stesso_numero: clienti.length > 1 ? elenco(clienti.map((c) => c.nominativo)) : '',
      saluto_nome: nome ? ` ${nome}` : '',
      cani: elenco(cani.map((c) => (c.razza ? `${c.nome}, ${c.razza.toLowerCase()}` : c.nome)), 'e'),
      prossimo_appuntamento: prossimo
        ? `${quando(prossimo.giorno, prossimo.ora, ctx)}, per ${prossimo.cane}${prossimo.servizio ? `, ${prossimo.servizio.toLowerCase()}` : ''}`
        : '',
      orari_sede: orariInParole(orari),
    },
  }
}
