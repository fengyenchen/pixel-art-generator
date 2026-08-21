import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { EditorTool, ShapeSettings } from './editor'

export interface UseCanvasDrawOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>
  activeTool: EditorTool
  color: string
  pixelSize: number
  onColorChange: (color: string) => void
  onEditStart: (canvas: HTMLCanvasElement) => void
  shapeSettings: ShapeSettings
  selection: CanvasSelection | null
  onSelectionChange: (selection: CanvasSelection | null) => void
}

export interface CanvasSelection {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasPointerHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLCanvasElement>) => void
}
