import type { PixelCanvasProps } from '../../types/canvas'

export default function PixelCanvas({ width, height, showGrid, zoom }: PixelCanvasProps) {
  return (
    <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-canvas-workspace shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 text-xs text-muted-foreground">
        <span>畫布 · {width} × {height} px</span>
        <span>{zoom}%</span>
      </div>

      <div className="canvas-workspace flex min-h-130 flex-1 items-center justify-center overflow-auto p-10">
        <div
          className="relative w-full max-w-150 overflow-hidden border border-border-strong bg-canvas shadow-xl shadow-primary/20"
          style={{ aspectRatio: `${width} / ${height}`, transform: `scale(${zoom / 100})` }}
        >
          {showGrid && <div className="pixel-grid absolute inset-0" />}
        </div>
      </div>
    </section>
  )
}
