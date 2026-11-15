import { Edu, periodOf } from './data'

const era = (e?: string) => (e && /^b/.test(e) ? -1 : 1)

export function yearsFrom(term: string): [number, number] | null {
  const s = term.toLowerCase().trim()
  let m = s.match(/^(\d{1,2})(?:st|nd|rd|th) century(?: (bce|bc|ce|ad))?$/)
  if (m) {
    const c = +m[1]
    return era(m[2]) < 0 ? [-c * 100, -(c - 1) * 100] : [(c - 1) * 100 + 1, c * 100]
  }
  m = s.match(/^(\d{1,4})s$/)
  if (m) { const n = +m[1]; return [n, n + (n % 100 === 0 ? 99 : 9)] }
  m = s.match(/^(\d{1,4})\s*(bce|bc|ce|ad)?\s*(?:-|to)\s*(\d{1,4})\s*(bce|bc|ce|ad)?$/)
  if (m) {
    const e2 = m[4], e1 = m[2] ?? e2
    const a = +m[1] * era(e1), b = +m[3] * era(e2)
    return [Math.min(a, b), Math.max(a, b)]
  }
  m = s.match(/^(\d{1,4})\s*(bce|bc|ce|ad)?$/)
  if (m) { const y = +m[1] * era(m[2]); return [y, y] }
  return null
}

export function search(edu: Edu[], query: string): Edu[] {
  const terms = query.split(',').map(t => t.trim()).filter(Boolean)
  if (!terms.length) return []
  return edu
    .filter(m => {
      const hay = [m.name, m.region, m.method, m.period || periodOf(m.from), m.blurb].join(' ').toLowerCase()
      return terms.every(t => {
        const yrs = yearsFrom(t)
        if (yrs) return m.from <= yrs[1] && m.to >= yrs[0]
        return t.toLowerCase().split(/\s+/).every(w => hay.includes(w))
      })
    })
    .sort((a, b) => a.from - b.from)
}