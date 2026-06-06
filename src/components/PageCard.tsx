import { useCallback, useRef } from 'react'
import type { PageConfig } from '../lib/types'
import { effectiveDims } from '../lib/types'
import type { PaperFormat } from '../lib/formats'
import { calculateGrid } from '../lib/grid'

interface Props {
  page: PageConfig
  pageNumber: number
  margin: number
  format: PaperFormat
  onUpdate: (updates: Partial<PageConfig>) => void
  onRemove: () => void
}

export default function PageCard({ page, pageNumber, margin, format, onUpdate, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const ar = img.naturalWidth / img.naturalHeight
        const { w, h } = effectiveDims(page, format)
        const grid = calculateGrid(page.count, ar, w, h)
        onUpdate({ imageDataUrl: dataUrl, imageAR: ar, ...grid })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [page.count, format],
  )

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const imgItem = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (imgItem) {
      const file = imgItem.getAsFile()
      if (file) handleFile(file)
    }
  }

  const handleCountChange = (next: number) => {
    if (next < 1 || next > 64) return
    const { w, h } = effectiveDims(page, format)
    const grid = calculateGrid(next, page.imageAR, w, h)
    onUpdate({ count: next, ...grid })
  }

  const handleOrientationChange = (orient: 'portrait' | 'landscape') => {
    const { w, h } = effectiveDims({ orientation: orient }, format)
    const grid = calculateGrid(page.count, page.imageAR, w, h)
    onUpdate({ orientation: orient, ...grid })
  }

  // Effective page dimensions after orientation
  const { w: effW, h: effH } = effectiveDims(page, format)

  // Preview dimensions — respect effective aspect ratio
  const prevW = 200
  const prevH = Math.round(prevW * (effH / effW))
  // Scale margin from mm to preview pixels
  const marginPx = margin * (prevW / effW)

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
        {/* Upload zone */}
        <div
          className={`upload-zone${page.imageDataUrl ? ' has-image' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {page.imageDataUrl ? (
            <img src={page.imageDataUrl} alt="uploaded" className="upload-thumb" />
          ) : (
            <span className="upload-hint">Drop, click, or paste</span>
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

          <div className="setting-row">
            <span className="setting-label">Orientation</span>
            <div className="orient-ctrl">
              <button
                className={`orient-btn${page.orientation === 'portrait' ? ' active' : ''}`}
                onClick={() => handleOrientationChange('portrait')}
                title="Portrait"
              >
                <svg viewBox="0 0 10 14" width="10" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <rect x="0.75" y="0.75" width="8.5" height="12.5" rx="1.25" />
                </svg>
              </button>
              <button
                className={`orient-btn${page.orientation === 'landscape' ? ' active' : ''}`}
                onClick={() => handleOrientationChange('landscape')}
                title="Landscape"
              >
                <svg viewBox="0 0 14 10" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <rect x="0.75" y="0.75" width="12.5" height="8.5" rx="1.25" />
                </svg>
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Grid</span>
            <span className="setting-value">{page.cols} × {page.rows}</span>
          </div>

          {imgSize && (
            <div className="setting-row">
              <span className="setting-label">Each image</span>
              <span className="setting-value image-size">
                {imgSize.w.toFixed(1)} × {imgSize.h.toFixed(1)} cm
                {page.fit === 'cover' && <span className="size-note"> (cropped)</span>}
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
        </div>

        {/* Preview */}
        {page.imageDataUrl && (
          <div className="page-preview" style={{ width: prevW, height: prevH }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${page.cols}, 1fr)`,
                gridTemplateRows: `repeat(${page.rows}, 1fr)`,
                width: '100%',
                height: '100%',
                padding: marginPx,
              }}
            >
              {Array.from({ length: page.count }, (_, i) => (
                <div key={i} className="preview-cell">
                  <img src={page.imageDataUrl!} alt="" style={{ objectFit: page.fit }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
