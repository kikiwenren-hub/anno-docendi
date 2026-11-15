import land from './data/land.json'
import terrain from './data/terrain.json'
import key from './data/key.json'
import labels from './data/labels.json'

export type Pt = [number, number]
export interface Edu { id: string; name: string; at: Pt; from: number; to: number; region: string; method: string; blurb: string; period?: string }
export interface Label { name: string; at: Pt; from: number; to: number }

export const LAND = land as Pt[][]
export const TERRAIN = terrain as { kind: string; poly: Pt[] }[]
export const KEY = key as [string, string][]
export const LABELS = labels as Label[]
export const periodOf = (y: number) => y < -1200 ? 'Bronze Age' : y < 500 ? 'Classical antiquity' : y < 1000 ? 'Early medieval' : y < 1500 ? 'High medieval' : 'Early modern'

// Reads public/education.csv. Returns valid rows and the spreadsheet row numbers that were skipped.
export function parseEdu(text: string): { rows: Edu[]; bad: number[] } {
  const t = text.replace(/^\uFEFF/, '')
  const recs: string[][] = []
  let f = '', r: string[] = [], q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true
    else if (c === ',') { r.push(f); f = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; r.push(f); f = ''; recs.push(r); r = [] }
    else f += c
  }
  if (f || r.length) { r.push(f); recs.push(r) }
  if (!recs.length) return { rows: [], bad: [] }
  const head = recs[0].map(h => h.trim().toLowerCase())
  const col = (row: string[], n: string) => (row[head.indexOf(n)] ?? '').trim()
  const rows: Edu[] = [], bad: number[] = []
  recs.slice(1).forEach((row, i) => {
    if (row.every(c => !c.trim())) return
    const lon = parseFloat(col(row, 'longitude')), lat = parseFloat(col(row, 'latitude'))
    const from = parseFloat(col(row, 'start_year')), to = parseFloat(col(row, 'end_year'))
    if ([lon, lat, from, to].some(isNaN) || !col(row, 'name') || Math.abs(lon) > 180 || Math.abs(lat) > 90) { bad.push(i + 2); return }
    rows.push({ id: col(row, 'id') || `row${i + 2}`, name: col(row, 'name'), at: [lon, lat], from, to, region: col(row, 'region'), method: col(row, 'method'), period: col(row, 'period'), blurb: col(row, 'description') })
  })
  return { rows, bad }
}
