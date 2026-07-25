import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { EditorTool } from './editor'

export interface UseCanvasDrawOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>
  activeTool: EditorTool
  color: string
  pixelSize: number
  onColorChange: (color: string) => void
  onEditStart: (canvas: HTMLCanvasElement) => void
}

export interface CanvasPointerHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLCanvasElement>) => void
}
