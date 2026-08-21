export type EditorTool =
  | 'select'
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'shape'

export type ShapeKind = 'rectangle' | 'ellipse' | 'line'
export type ShapeStyle = 'fill' | 'outline'

export interface ShapeSettings {
  kind: ShapeKind
  style: ShapeStyle
  strokeWidth: number
}

export interface EditorAdjustments {
  pixelSize: number
  zoom: number
  showGrid: boolean
  paletteSize: number
  cleanNoise: boolean
}
