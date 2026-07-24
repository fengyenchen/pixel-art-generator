import type { PixelCanvasProps } from '../../types/canvas'

export default function PixelCanvas({ width, height, pixelSize, showGrid, zoom }: PixelCanvasProps) {
  const scale = zoom / 100
  const displayWidth = Math.max(1, width * scale)
  const displayHeight = Math.max(1, height * scale)
  const displayCellSize = Math.max(1, pixelSize * scale)
  const columns = Math.ceil(Math.max(0, width) / pixelSize)
  const rows = Math.ceil(Math.max(0, height) / pixelSize)

  return (
    <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-canvas-workspace shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 text-xs text-muted-foreground">
        <span>畫布 · {width} × {height} px</span>
        <span>{columns} × {rows} 格 · {zoom}%</span>
      </div>

      <div className="canvas-workspace min-h-130 flex-1 overflow-auto">
        <div className="grid h-max min-h-full w-max min-w-full place-items-center p-10">
          <div
            className="relative shrink-0 overflow-hidden border border-border-strong bg-canvas shadow-xl shadow-primary/20"
            style={{ width: displayWidth, height: displayHeight }}
          >
            {showGrid && (
              <div
                className="pixel-grid pointer-events-none absolute inset-0"
                style={{ backgroundSize: `${displayCellSize}px ${displayCellSize}px` }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
