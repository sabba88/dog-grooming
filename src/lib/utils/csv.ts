/**
 * Export per Excel.
 *
 * Il file e' un CSV, non un .xlsx: Excel in italiano lo apre con un doppio click
 * purche' il separatore sia il punto e virgola e il file inizi con il BOM UTF-8,
 * altrimenti accenti e lettere accentate arrivano storte. Cosi' l'export non porta
 * dietro nessuna dipendenza e resta leggibile anche da Fogli Google e LibreOffice.
 */

export type CsvCell = string | number | null | undefined

const SEPARATOR = ';'
const BOM = '﻿'

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  // Le virgolette si raddoppiano; si quota solo dove serve, per non sporcare il file.
  if (/["\r\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(SEPARATOR))
  // CRLF: e' quello che Excel si aspetta nei campi su piu' righe.
  return BOM + lines.join('\r\n')
}

/** Data in formato italiano, quello che Excel riconosce come data senza conversioni. */
export function csvDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/** Ora dell'appuntamento: gli orari sono salvati in UTC e vanno letti come tali. */
export function csvTime(value: Date | string | null | undefined): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

/** Importo in euro con la virgola decimale: Excel italiano lo legge come numero. */
export function csvPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

/** Scarica il CSV dal browser. Va chiamata solo da un componente client. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Nome file con la data del giorno: gli export si accumulano senza sovrascriversi. */
export function csvFilename(prefix: string): string {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  return `${prefix}-${stamp}.csv`
}
