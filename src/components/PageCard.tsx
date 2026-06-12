import { useRef } from 'react'
import type { PageConfig } from '../lib/types'
import { effectiveDims } from '../lib/types'
import type { PaperFormat } from '../lib/formats'
import { calculateGrid } from '../lib/grid'
import { readImageFile } from '../lib/image'

interface Props {
  page: PageConfig
  pageNumber: number
  margin: number
  orientation: 'portrait' | 'landscape'
  format: PaperFormat
  onUpdate: (updates: Partial<PageConfig>) => void
  onRemove: () => void
}

export default function PageCard({ page, pageNumber, margin, orientation, format, onUpdate, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { w: effW, h: effH } = effectiveDims(orientation, format)

  const handleFile = async (file: File) => {
    const loaded = await readImageFile(file)
    if (!loaded) return
    const grid = calculateGrid(page.count, loaded.ar, effW, effH)
    onUpdate({ imageDataUrl: loaded.dataUrl, imageAR: loaded.ar, ...grid })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const imgItem = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    const file = imgItem?.getAsFile()
    if (file) handleFile(file)
  }

  const handleCountChange = (next: number) => {
    if (next < 1 || next > 64) return
    const grid = calculateGrid(next, page.imageAR, effW, effH)
    onUpdate({ count: next, ...grid })
  }

  // Margin as a fraction of sheet size — CSS % padding is always relative
  // to width, so a single horizontal fraction yields equal mm on all sides
  const marginPctW = (margin / effW) * 100
  const marginPctH = (margin / effH) * 100

  // Printed image dimensions in cm
  const availW_mm = effW - 2 * margin
  const availH_mm = effH - 2 * margin
  const cellW_mm = availW_mm / page.cols
  const cellH_mm = availH_mm / page.rows
  const imgSize = (() => {
    if (!page.imageDataUrl) return null
    if (page.fit === 'cover') return { w: cellW_mm / 10, h: cellH_mm / 10 }
    const cellAR = cellW_mm / cellH_mm
    if (page.imageAR > cellAR) return { w: cellW_mm / 10, h: cellW_mm / page.imageAR / 10 }
    return { w: (cellH_mm * page.imageAR) / 10, h: cellH_mm / 10 }
  })()

  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="page-label">Page {pageNumber}</span>
        <button className="btn-icon" onClick={onRemove} title="Remove">×</button>
      </div>

      <div className="page-card-body">
        {/* The sheet — preview and upload zone in one */}
        <div className="sheet-wrap">
          <div
            className={`sheet upload-zone${page.imageDataUrl ? '' : ' empty'}`}
            style={{ aspectRatio: `${effW} / ${effH}` }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={page.imageDataUrl ? 'Replace image' : 'Upload image'}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            {page.imageDataUrl ? (
              <>
                <div
                  className="sheet-grid"
                  style={{
                    gridTemplateColumns: `repeat(${page.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${page.rows}, 1fr)`,
                    padding: `${marginPctW}%`,
                  }}
                >
                  {Array.from({ length: page.count }, (_, i) => (
                    <div key={i} className="sheet-cell">
                      <img src={page.imageDataUrl!} alt="" style={{ objectFit: page.fit }} />
                    </div>
                  ))}
                </div>
                {margin > 0 && (
                  <div
                    className="sheet-guides"
                    style={{
                      top: `${marginPctH}%`,
                      bottom: `${marginPctH}%`,
                      left: `${marginPctW}%`,
                      right: `${marginPctW}%`,
                    }}
                  />
                )}
                {imgSize && (
                  <span className="sheet-badge">
                    {imgSize.w.toFixed(1)} × {imgSize.h.toFixed(1)} cm each
                    {page.fit === 'cover' && <span className="size-note"> · cropped</span>}
                  </span>
                )}
              </>
            ) : (
              <span className="sheet-hint">
                Drop an image,
                <br />
                paste (⌘V), or click
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="page-settings">
          <div className="setting-row">
            <label className="setting-label">Copies per page</label>
            <div className="count-ctrl">
              <button onClick={() => handleCountChange(page.count - 1)} disabled={page.count <= 1}>
                −
              </button>
              <input
                type="number"
                value={page.count}
                min={1}
                max={64}
                onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
              />
              <button onClick={() => handleCountChange(page.count + 1)}>+</button>
            </div>
          </div>

          {page.imageDataUrl && (
            <div className="setting-row">
              <span className="setting-label">Grid</span>
              <span className="setting-value">{page.cols} × {page.rows}</span>
            </div>
          )}

          {imgSize && (
            <div className="setting-row">
              <span className="setting-label">Each image</span>
              <span className="setting-value image-size">
                {imgSize.w.toFixed(1)} × {imgSize.h.toFixed(1)} cm
              </span>
            </div>
          )}

          <label className="setting-check">
            <input
              type="checkbox"
              checked={page.fit === 'cover'}
              onChange={(e) => onUpdate({ fit: e.target.checked ? 'cover' : 'contain' })}
            />
            Fill cell (crop if needed)
          </label>

          {page.imageDataUrl && (
            <p className="settings-hint">Click the sheet to replace the image.</p>
          )}
        </div>
      </div>
    </div>
  )
}
