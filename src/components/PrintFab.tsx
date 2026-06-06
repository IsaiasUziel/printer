interface Props {
  visible: boolean
}

export default function PrintFab({ visible }: Props) {
  if (!visible) return null

  return (
    <button
      className="fab no-print"
      onClick={() => window.print()}
      aria-label="Print / Export PDF"
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
      <span className="fab-label">Print / Export PDF</span>
    </button>
  )
}
