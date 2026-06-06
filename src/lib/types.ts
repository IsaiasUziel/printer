export interface PageConfig {
  id: string
  imageDataUrl: string | null
  imageAR: number
  count: number
  cols: number
  rows: number
  fit: 'contain' | 'cover'
  orientation: 'portrait' | 'landscape'
}

export function effectiveDims(pg: Pick<PageConfig, 'orientation'>, format: { w: number; h: number }) {
  return pg.orientation === 'landscape'
    ? { w: format.h, h: format.w }
    : { w: format.w, h: format.h }
}
