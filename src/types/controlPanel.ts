export interface ControlPanelProps {
  canvasWidth: number
  canvasHeight: number
  pixelSize: number
  showGrid: boolean
  zoom: number
  paletteSize: number
  cleanNoise: boolean
  onCanvasWidthChange: (value: number) => void
  onCanvasHeightChange: (value: number) => void
  onPixelSizeChange: (value: number) => void
  onGridChange: (value: boolean) => void
  onZoomChange: (value: number) => void
  onPaletteSizeChange: (value: number) => void
  onCleanNoiseChange: (value: boolean) => void
}

export interface RangeRowProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}
