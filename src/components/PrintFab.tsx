import { useEffect, useState } from 'react'

interface Props {
  visible: boolean
  pageCount: number
  formatLabel: string
  orientation: 'portrait' | 'landscape'
}

const TIP_DURATION_MS = 7000

export default function PrintFab({ visible, pageCount, formatLabel, orientation }: Props) {
  const [tipVisible, setTipVisible] = useState(true)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setTipVisible(false), TIP_DURATION_MS)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible) return null

  const summary = `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} · ${formatLabel} · ${
    orientation === 'portrait' ? 'Portrait' : 'Landscape'
  }`

  return (
    <div className="fab-stack no-print">
      {tipVisible && <span className="fab-tip">Tip: set browser margins to “None”</span>}
      <button
        className="fab"
        onClick={() => window.print()}
        aria-label={`Print / Export PDF — ${summary}`}
      >
        <svg
          className="fab-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        <span className="fab-label">{summary} — Print PDF</span>
      </button>
    </div>
  )
}
