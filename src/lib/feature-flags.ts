/**
 * Interruttori per tenere fuori dall'interfaccia pezzi che esistono nel codice
 * ma che non vogliamo mostrare ancora.
 *
 * Nascondere, non cancellare: il codice resta, le tabelle restano, l'assistente
 * vocale continua a scrivere i messaggi che riceve. Si riaccende rimettendo
 * `true` qui e basta, senza ritrovare i punti da cui era stato tolto.
 */

/**
 * La sezione "Messaggi dal telefono": voce di menu, contatore dei non letti
 * nella barra laterale e pagina `/messages`.
 *
 * Spenta il 24/11/2026 perche' in questa fase il gestionale si mostra come
 * demo e l'assistente vocale non e' ancora parte di cio' che si racconta.
 * L'API `/api/voce` resta attiva: i messaggi continuano ad arrivare e si
 * rivedranno tutti quando questa torna `true`.
 */
export const MESSAGGI_TELEFONO_VISIBILI = false
