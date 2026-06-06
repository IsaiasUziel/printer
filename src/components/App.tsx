import { useState, useEffect, useRef } from 'react'
import type { PageConfig } from '../lib/types'
import type { PaperFormat } from '../lib/formats'
import { FORMATS, DEFAULT_FORMAT } from '../lib/formats'
import { calculateGrid } from '../lib/grid'
import PageCard from './PageCard'
import PrintFab from './PrintFab'

const DEFAULT_COUNT = 4

function newPage(): PageConfig {
  return {
    id: crypto.randomUUID(),
    imageDataUrl: null,
    imageAR: 1,
    count: DEFAULT_COUNT,
    cols: 2,
    rows: 2,
    fit: 'contain',
  }
}

export default function App() {
  const [pages, setPages] = useState<PageConfig[]>([])
  const [margin, setMargin] = useState(10)
  const [format, setFormat] = useState<PaperFormat>(DEFAULT_FORMAT)

  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const formatRef = useRef(format)
  formatRef.current = format

  const addPage = () => setPages((p) => [...p, newPage()])

  // Inject @page size rule so the browser knows the target paper size
  useEffect(() => {
    let el = document.getElementById('dyn-page-size') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'dyn-page-size'
      document.head.appendChild(el)
    }
    el.textContent = `@page { size: ${format.w}mm ${format.h}mm portrait; margin: 0; }`
  }, [format])

  // Recalculate all grids when format changes
  useEffect(() => {
    setPages((prev) =>
      prev.map((pg) => {
        if (!pg.imageDataUrl) return pg
        return { ...pg, ...calculateGrid(pg.count, pg.imageAR, format.w, format.h) }
      }),
    )
  }, [format])

  // Global paste → first empty page, or last page, or create new
  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement)?.closest('.upload-zone')) return
      const imgItem = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/'),
      )
      if (!imgItem) return
      const file = imgItem.getAsFile()
      if (!file) return

      const fmt = formatRef.current
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const img = new Image()
        img.onload = () => {
          const ar = img.naturalWidth / img.naturalHeight
          const current = pagesRef.current
          const target = current.find((p) => !p.imageDataUrl) ?? current[current.length - 1]
          if (target) {
            const grid = calculateGrid(target.count, ar, fmt.w, fmt.h)
            setPages((prev) =>
              prev.map((p) =>
                p.id === target.id ? { ...p, imageDataUrl: dataUrl, imageAR: ar, ...grid } : p,
              ),
            )
          } else {
            const pg = newPage()
            const grid = calculateGrid(pg.count, ar, fmt.w, fmt.h)
            setPages([{ ...pg, imageDataUrl: dataUrl, imageAR: ar, ...grid }])
          }
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    }

    document.addEventListener('paste', onGlobalPaste)
    return () => document.removeEventListener('paste', onGlobalPaste)
  }, [])

  const updatePage = (id: string, updates: Partial<PageConfig>) =>
    setPages((p) => p.map((pg) => (pg.id === id ? { ...pg, ...updates } : pg)))

  const removePage = (id: string) => setPages((p) => p.filter((pg) => pg.id !== id))

  const printableCount = pages.filter((p) => p.imageDataUrl).length

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="app-header no-print">
        <div className="app-header-inner">
          <h1 className="app-title">Print Layout</h1>

          <div className="app-actions">
            <div className="btn-group" role="group" aria-label="Paper format">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  className={`btn-group-item${format.id === f.id ? ' active' : ''}`}
                  onClick={() => setFormat(f)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="margin-ctrl">
              <label htmlFor="margin-input">Margin</label>
              <input
                id="margin-input"
                type="number"
                value={margin}
                min={0}
                max={30}
                onChange={(e) => setMargin(Math.max(0, Math.min(30, Number(e.target.value))))}
              />
              <span>mm</span>
            </div>

            <button className="btn btn-secondary" onClick={addPage}>
              + New page
            </button>
          </div>
        </div>
      </header>

      {/* ── Page cards ────────────────────────────────────────── */}
      <div className="app no-print">
        {pages.length === 0 ? (
          <div className="empty-state">
            <p>No pages yet.</p>
            <button className="btn btn-primary" onClick={addPage}>
              + New page
            </button>
          </div>
        ) : (
          <div className="pages-list">
            {pages.map((pg, i) => (
              <PageCard
                key={pg.id}
                page={pg}
                pageNumber={i + 1}
                margin={margin}
                format={format}
                onUpdate={(u) => updatePage(pg.id, u)}
                onRemove={() => removePage(pg.id)}
              />
            ))}
          </div>
        )}
      </div>

      <PrintFab visible={printableCount > 0} />

      {/* ── Print-only layout ─────────────────────────────────── */}
      <div className="print-only">
        {pages
          .filter((pg) => pg.imageDataUrl)
          .map((pg) => (
            <div
              key={pg.id}
              className="print-page"
              style={{
                width: `${format.w}mm`,
                height: `${format.h}mm`,
                display: 'grid',
                gridTemplateColumns: `repeat(${pg.cols}, 1fr)`,
                gridTemplateRows: `repeat(${pg.rows}, 1fr)`,
                padding: `${margin}mm`,
              }}
            >
              {Array.from({ length: pg.count }, (_, i) => (
                <div key={i} className="print-cell">
                  <img src={pg.imageDataUrl!} alt="" style={{ objectFit: pg.fit }} />
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  )
}
