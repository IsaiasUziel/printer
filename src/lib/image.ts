export interface LoadedImage {
  dataUrl: string
  ar: number
}

/** Read an image file into a data URL + aspect ratio. Resolves null for non-images or read errors. */
export function readImageFile(file: File): Promise<LoadedImage | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(null)
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onerror = () => resolve(null)
      img.onload = () => resolve({ dataUrl, ar: img.naturalWidth / img.naturalHeight })
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}
