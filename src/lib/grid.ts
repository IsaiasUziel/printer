/**
 * Finds the col/row layout that maximizes image area within each cell.
 * Score = min(cellAR/imgAR, imgAR/cellAR) → 1.0 means perfect aspect-ratio match.
 */
export function calculateGrid(
  count: number,
  imgAR: number,
  pageW = 215.9,
  pageH = 279.4,
): { cols: number; rows: number } {
  if (count <= 0) return { cols: 1, rows: 1 }

  const pageAR = pageW / pageH
  let bestCols = 1
  let bestScore = -1

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const cellAR = (pageAR * rows) / cols
    const score = Math.min(cellAR / imgAR, imgAR / cellAR)
    if (score > bestScore) {
      bestScore = score
      bestCols = cols
    }
  }

  return { cols: bestCols, rows: Math.ceil(count / bestCols) }
}
