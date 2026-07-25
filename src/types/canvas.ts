export interface CanvasSize {
  width: number
  height: number
}

export interface PixelCanvasProps {
  width: number
  height: number
  pixelSize: number
  showGrid: boolean
  zoom: number
  sourceImage: ImageBitmap | null
}

export interface UsePixelateOptions {
  sourceImage: ImageBitmap | null
  width: number
  height: number
  pixelSize: number
}
