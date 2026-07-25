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
  paletteSize: number
  cleanNoise: boolean
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void
  activeTool: EditorTool
  color: string
  onColorChange: (color: string) => void
}

export interface UsePixelateOptions {
  sourceImage: ImageBitmap | null
  width: number
  height: number
  pixelSize: number
  paletteSize: number
  cleanNoise: boolean
}
import type { EditorTool } from './editor'
