import { useState, useEffect, useRef } from 'react'
import type { PageConfig } from '../lib/types'
import { effectiveDims } from '../lib/types'
import type { PaperFormat } from '../lib/formats'
import { FORMATS, DEFAULT_FORMAT } from '../lib/formats'
import { calculateGrid } from '../lib/grid'
import { readImageFile } from '../lib/image'
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  const heroInputRef = useRef<HTMLInputElement>(null)

  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const formatRef = useRef(format)
  formatRef.current = format
  const orientRef = useRef(orientation)
  orientRef.current = orientation

  const addPage = () => setPages((p) => [...p, newPage()])

  const addPageWithFile = async (file: File) => {
    const loaded = await readImageFile(file)
    if (!loaded) return
    const { w, h } = effectiveDims(orientRef.current, formatRef.current)
    const pg = newPage()
    const grid = calculateGrid(pg.count, loaded.ar, w, h)
    setPages((prev) => [...prev, { ...pg, imageDataUrl: loaded.dataUrl, imageAR: loaded.ar, ...grid }])
  }

  // Inject a single @page rule — format + orientation — so Chrome honors it
  useEffect(() => {
    let el = document.getElementById('dyn-page-size') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'dyn-page-size'
      document.head.appendChild(el)
    }
    const { w, h } = effectiveDims(orientation, format)
    el.textContent = `@page { size: ${w}mm ${h}mm ${orientation}; margin: 0; }`
  }, [format, orientation])

  // Recalculate all grids when format or orientation changes
  useEffect(() => {
    const { w, h } = effectiveDims(orientation, format)
    setPages((prev) =>
      prev.map((pg) => {
        if (!pg.imageDataUrl) return pg
        return { ...pg, ...calculateGrid(pg.count, pg.imageAR, w, h) }
      }),
    )
  }, [format, orientation])

  // Global paste → first empty page, or last page, or create new
  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement)?.closest('.upload-zone')) return
      const imgItem = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/'),
      )
      const file = imgItem?.getAsFile()
      if (!file) return

      void (async () => {
        const loaded = await readImageFile(file)
        if (!loaded) return
        const { w, h } = effectiveDims(orientRef.current, formatRef.current)
        const current = pagesRef.current
        const target = current.find((p) => !p.imageDataUrl) ?? current[current.length - 1]
        if (target) {
          const grid = calculateGrid(target.count, loaded.ar, w, h)
          setPages((prev) =>
            prev.map((p) =>
              p.id === target.id
                ? { ...p, imageDataUrl: loaded.dataUrl, imageAR: loaded.ar, ...grid }
                : p,
            ),
          )
        } else {
          const pg = newPage()
          const grid = calculateGrid(pg.count, loaded.ar, w, h)
          setPages([{ ...pg, imageDataUrl: loaded.dataUrl, imageAR: loaded.ar, ...grid }])
        }
      })()
    }

    document.addEventListener('paste', onGlobalPaste)
    return () => document.removeEventListener('paste', onGlobalPaste)
  }, [])

  const updatePage = (id: string, updates: Partial<PageConfig>) =>
    setPages((p) => p.map((pg) => (pg.id === id ? { ...pg, ...updates } : pg)))

  const removePage = (id: string) => setPages((p) => p.filter((pg) => pg.id !== id))

  const printableCount = pages.filter((p) => p.imageDataUrl).length
  const { w: effW, h: effH } = effectiveDims(orientation, format)

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────── */}
      <header className="app-header no-print">
        <div className="app-header-inner">
          <h1 className="app-title">Print Layout</h1>

          <div className="app-actions">
            <a
              className="github-link"
              href="https://github.com/IsaiasUziel/printer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </a>

            {/* Format */}
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

            {/* Orientation */}
            <div className="btn-group" role="group" aria-label="Page orientation">
              <button
                className={`btn-group-item orient-item${orientation === 'portrait' ? ' active' : ''}`}
                onClick={() => setOrientation('portrait')}
                title="Portrait"
              >
                <svg viewBox="0 0 10 14" width="10" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <rect x="0.75" y="0.75" width="8.5" height="12.5" rx="1.25" />
                </svg>
              </button>
              <button
                className={`btn-group-item orient-item${orientation === 'landscape' ? ' active' : ''}`}
                onClick={() => setOrientation('landscape')}
                title="Landscape"
              >
                <svg viewBox="0 0 14 10" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <rect x="0.75" y="0.75" width="12.5" height="8.5" rx="1.25" />
                </svg>
              </button>
            </div>

            {/* Margin */}
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
            <div
              className="drop-hero"
              style={{ aspectRatio: `${effW} / ${effH}` }}
              onClick={() => heroInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) addPageWithFile(file)
              }}
              onDragOver={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              aria-label="Upload an image to start"
              onKeyDown={(e) => e.key === 'Enter' && heroInputRef.current?.click()}
            >
              <svg className="drop-hero-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="drop-hero-title">Drop an image here</span>
              <span className="drop-hero-sub">paste (⌘V) or click to browse</span>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) addPageWithFile(f)
                }}
              />
            </div>
            <button className="btn btn-secondary" onClick={addPage}>
              or start with an empty page
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
                orientation={orientation}
                format={format}
                onUpdate={(u) => updatePage(pg.id, u)}
                onRemove={() => removePage(pg.id)}
              />
            ))}
          </div>
        )}
      </div>

      <PrintFab
        visible={printableCount > 0}
        pageCount={printableCount}
        formatLabel={format.label}
        orientation={orientation}
      />

      {/* ── Print-only layout ─────────────────────────────────── */}
      <div className="print-only">
        {pages
          .filter((pg) => pg.imageDataUrl)
          .map((pg) => (
            <div
              key={pg.id}
              className="print-page"
              style={{
                width: `${effW}mm`,
                height: `${effH}mm`,
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
