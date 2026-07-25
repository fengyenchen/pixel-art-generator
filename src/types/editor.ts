export type EditorTool =
  | 'select'
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'eyedropper'

export interface EditorAdjustments {
  pixelSize: number
  zoom: number
  showGrid: boolean
  paletteSize: number
  cleanNoise: boolean
}
