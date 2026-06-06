export interface PaperFormat {
  id: string
  label: string
  w: number // mm
  h: number // mm
}

export const FORMATS: PaperFormat[] = [
  { id: 'letter', label: 'Carta', w: 215.9, h: 279.4 },
  { id: 'a4',     label: 'A4',    w: 210,   h: 297   },
  { id: 'legal',  label: 'Legal', w: 215.9, h: 355.6 },
]

export const DEFAULT_FORMAT = FORMATS[0]
