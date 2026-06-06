export interface PageConfig {
  id: string
  imageDataUrl: string | null
  imageAR: number
  count: number
  cols: number
  rows: number
  fit: 'contain' | 'cover'
}
