export interface PageConfig {
  id: string
  imageDataUrl: string | null
  imageAR: number
  count: number
  cols: number
  rows: number
  fit: 'contain' | 'cover'
}

export function effectiveDims(
  orientation: 'portrait' | 'landscape',
  format: { w: number; h: number },
) {
  return orientation === 'landscape'
    ? { w: format.h, h: format.w }
    : { w: format.w, h: format.h }
}
