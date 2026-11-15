import { useEffect, useMemo, useRef, useState } from 'react'
import tl from './data/timeline.json'
import cfg from './data/settings.json'
import { KEY, LABELS, LAND, TERRAIN, periodOf, parseEdu, Edu, Pt } from './data'
import { search } from './search'

const W = 360, H = 174, MAXK = 6
let from = tl.start, acc = 0
const SEG = tl.stages.map(g => {
  const n = Math.round((g.until - from) / g.step), seg = { from, to: g.until, step: g.step, n, i0: acc }
  acc += n; from = g.until; return seg
})
const END = acc
const yearAt = (i: number) => { const g = SEG.find(s => i <= s.i0 + s.n) ?? SEG[SEG.length - 1]; return g.from + (i - g.i0) * g.step }
const posOf = (y: number) => { const g = SEG.find(s => y <= s.to) ?? SEG[SEG.length - 1]; return g.i0 + (y - g.from) / g.step }
const TICKS = tl.ticks.map(y => ({ y, pos: posOf(y) }))
const fmt = (y: number) => y < 0 ? `${-y} BCE` : `${y} CE`
const xy = ([lon, lat]: Pt): Pt => [lon + 180, 84 - lat]
const d = (p: Pt[]) => 'M' + p.map(q => xy(q).join(',')).join('L') + 'Z'
const FILL = Object.fromEntries(KEY)

export default function App() {
  const [pos, setPos] = useState(0)
  const [cam, setCam] = useState({ k: 1, x: 0, y: 0 })
  const [sel, setSel] = useState<string | null>(null)
  const [method, setMethod] = useState('All')
  const drag = useRef<{ x: number; y: number } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const year = yearAt(pos)
  const [edu, setEdu] = useState<Edu[]>([])
  const [bad, setBad] = useState<number[]>([])
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    document.title = cfg.title
    fetch('education.csv').then(r => { if (!r.ok) throw new Error(); return r.text() })
      .then(t => { const o = parseEdu(t); setEdu(o.rows); setBad(o.bad) }).catch(() => setErr('Could not load education.csv'))
  }, [])

  const zoom = (k: number) => setCam(c => {
    const nk = Math.min(MAXK, Math.max(1, k)), w = W / nk, h = H / nk
    const cx = c.x + W / c.k / 2, cy = c.y + H / c.k / 2
    return { k: nk, x: Math.min(W - w, Math.max(0, cx - w / 2)), y: Math.min(H - h, Math.max(0, cy - h / 2)) }
  })
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !svg.current) return
    const u = W / cam.k / svg.current.clientWidth
    const nx = cam.x - (e.clientX - drag.current.x) * u, ny = cam.y - (e.clientY - drag.current.y) * u
    drag.current = { x: e.clientX, y: e.clientY }
    setCam(c => ({ ...c, x: Math.min(W - W / c.k, Math.max(0, nx)), y: Math.min(H - H / c.k, Math.max(0, ny)) }))
  }

  const pins = edu.filter(m => year >= m.from && year <= m.to && (method === 'All' || m.method === method))
  const fs = 3.8 / cam.k, r = 2.2 / cam.k
  const shown = useMemo(() => {
    const boxes = pins.map(m => { const [x, y] = xy(m.at); return { x1: x - r * 1.6, x2: x + r * 1.6, y1: y - r * 1.6, y2: y + r * 1.6 } })
    const keep = new Set<string>()
    for (const l of LABELS.filter(l => year >= l.from && year <= l.to)) {
      const [x, y] = xy(l.at), w = l.name.length * fs * 0.58 / 2, h = fs / 2
      const b = { x1: x - w, x2: x + w, y1: y - h, y2: y + h }
      if (boxes.some(o => b.x1 < o.x2 && b.x2 > o.x1 && b.y1 < o.y2 && b.y2 > o.y1)) continue
      boxes.push(b); keep.add(l.name)
    }
    return keep
  }, [year, method, cam.k, edu])
  const chosen = edu.find(m => m.id === sel)
    const results = useMemo(() => search(edu, q), [edu, q])
  const goTo = (m: Edu) => {
    const y = Math.min(Math.max(m.from, tl.start), SEG[SEG.length - 1].to)
    setPos(Math.ceil(posOf(y) - 1e-9)); setMethod('All'); setSel(m.id)
    const k = 2, w = W / k, h = H / k, [x, yy] = xy(m.at)
    setCam({ k, x: Math.min(W - w, Math.max(0, x - w / 2)), y: Math.min(H - h, Math.max(0, yy - h / 2)) })
  }
  const methods = ['All', ...Array.from(new Set(edu.map(m => m.method)))]

  return (
    <div className="app">
      <header>
        <h1>{cfg.title}</h1><p className="intro" key="i">{cfg.intro}</p>
        <input className="search" type="search" placeholder="Enter: 1400s, Scribal, Italy" value={q} onChange={e => setQ(e.target.value)} aria-label="Search markers" />
      </header>
      <main className="mapwrap">
        <svg ref={svg} className="map" viewBox={`${cam.x} ${cam.y} ${W / cam.k} ${H / cam.k}`}
          onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId) }}
          onPointerMove={onMove} onPointerUp={() => (drag.current = null)}
          onWheel={e => zoom(cam.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2))}>
          <defs><clipPath id="land">{LAND.map((p, i) => <path key={i} d={d(p)} />)}</clipPath></defs>
          <rect x="0" y="0" width={W} height={H} fill="#a9c9d6" />
          {LAND.map((p, i) => <path key={i} d={d(p)} fill={FILL['other land']} stroke="#7d8f96" strokeWidth={0.25 / cam.k} />)}
          <g clipPath="url(#land)">{TERRAIN.map((t, i) => <path key={i} d={d(t.poly)} fill={FILL[t.kind]} opacity="0.85" />)}</g>
          {LABELS.map(l => { const [x, y] = xy(l.at); const on = shown.has(l.name)
            return <text key={l.name} x={x} y={y} fontSize={fs} textAnchor="middle" className="lbl" style={{ opacity: on ? 1 : 0 }}>{l.name}</text> })}
          {edu.map(m => { const [x, y] = xy(m.at); const on = pins.includes(m)
            return <circle key={m.id} cx={x} cy={y} r={r} strokeWidth={0.7 / cam.k} className={'pin' + (m.id === sel ? ' sel' : '')}
              style={{ opacity: on ? 1 : 0, pointerEvents: on ? 'auto' : 'none' }}
              onPointerDown={e => e.stopPropagation()} onClick={() => setSel(m.id)}><title>{m.name}</title></circle> })}
        </svg>
        <svg className="compass" viewBox="-20 -20 40 40" aria-label="North is up"><circle r="17" fill="#fff" stroke="#1d2b36" /><path d="M0-14L4 2H-4Z" fill="#1d2b36" /><text y="14" textAnchor="middle" fontSize="9">N</text></svg>
        <div className="zoom">
          <button onClick={() => zoom(cam.k * 1.5)} aria-label="Zoom in">+</button>
          <button onClick={() => zoom(cam.k / 1.5)} aria-label="Zoom out">-</button>
          <button onClick={() => setCam({ k: 1, x: 0, y: 0 })}>Home</button>
        </div>
      </main>
      <aside>
          {q.trim() && <>
          <h2>Results ({results.length})</h2>
          <ul className="results">{results.length ? results.map(m => <li key={m.id}><button onClick={() => goTo(m)}>{m.name}<small>{m.region}, {fmt(m.from)} to {fmt(m.to)}</small></button></li>) : <li className="muted">No matches.</li>}</ul>
        </>}
        <h2>Terrain</h2>
        <ul className="key">{KEY.map(([n, c]) => <li key={n}><i style={{ background: c }} />{n}</li>)}<li><i style={{ background: '#a9c9d6' }} />ocean</li></ul>
        <h2>Method</h2>
        <div className="chips">{methods.map(m => <button key={m} className={m === method ? 'on' : ''} onClick={() => setMethod(m)}>{m}</button>)}</div>
        <h2>Selected</h2>
        {chosen ? <article>
          <h3>{chosen.name}</h3>
          <div className="chips tags"><span>{chosen.period || periodOf(chosen.from)}</span><span>{chosen.region}</span><span>{chosen.method}</span></div>
          <p>{chosen.blurb}</p>
          <p className="muted">Longitude {chosen.at[0]}, latitude {chosen.at[1]}</p>
        </article> : <p className="muted">Select a marker on the map.</p>}
        {err && <p className="muted">{err}</p>}
        {bad.length > 0 && <p className="muted">Skipped spreadsheet rows {bad.join(', ')}. Check their numbers.</p>}
      </aside>
      <footer>
        <div className="year">{fmt(year)} <small>{periodOf(year)}</small></div>
        <div className="track">
          {TICKS.map((t, i) => <span key={t.y} className="tick" style={{ left: `calc(8px + (100% - 16px) * ${t.pos / END})`, height: 6 + i * 2 }} />)}
          <input type="range" min={0} max={END} value={pos} onChange={e => setPos(+e.target.value)} aria-label="Year" />
        </div>
      </footer>
    </div>
  )
}
