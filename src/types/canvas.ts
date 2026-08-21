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
  hasManualEdits: boolean
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void
  activeTool: EditorTool
  color: string
  onColorChange: (color: string) => void
  onEditStart: (canvas: HTMLCanvasElement) => void
  onImageSelect: (file: File) => Promise<void>
  onProjectLoad: (file: File) => Promise<void>
  shapeSettings: ShapeSettings
}

export interface UsePixelateOptions {
  sourceImage: ImageBitmap | null
  width: number
  height: number
  pixelSize: number
  paletteSize: number
  cleanNoise: boolean
  hasManualEdits: boolean
}
import type { EditorTool, ShapeSettings } from './editor'
