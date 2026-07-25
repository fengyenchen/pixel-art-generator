export interface PixelArtProjectSettings {
  pixelSize: number
  paletteSize: number
  zoom: number
  showGrid: boolean
  cleanNoise: boolean
  color: string
}

export interface PixelArtProject {
  format: 'pixel-art-generator'
  canvas: {
    width: number
    height: number
    pixelData: string
  }
  settings: PixelArtProjectSettings
}
