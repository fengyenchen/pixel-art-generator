import { useState } from 'react'
import type { DragEvent } from 'react'
import { Upload } from 'lucide-react'
import type { PixelCanvasProps } from '../../types/canvas'
import { usePixelate } from '../../hooks/usePixelate'
import { useCanvasDraw } from '../../hooks/useCanvasDraw'

export default function PixelCanvas({ width, height, pixelSize, showGrid, zoom, sourceImage, paletteSize, cleanNoise, hasManualEdits, onCanvasReady, activeTool, color, onColorChange, onEditStart, onImageSelect }: PixelCanvasProps) {
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const canvasRef = usePixelate({ sourceImage, width, height, pixelSize, paletteSize, cleanNoise, hasManualEdits })
  const pointerHandlers = useCanvasDraw({ canvasRef, activeTool, color, pixelSize, onColorChange, onEditStart })
  const scale = zoom / 100
  const displayWidth = Math.max(1, width * scale)
  const displayHeight = Math.max(1, height * scale)
  const columns = Math.ceil(Math.max(0, width) / pixelSize)
  const rows = Math.ceil(Math.max(0, height) / pixelSize)
  const verticalLines = Array.from({ length: Math.max(0, columns - 1) }, (_, index) => (index + 1) * pixelSize)
    .filter((position) => position < width)
  const horizontalLines = Array.from({ length: Math.max(0, rows - 1) }, (_, index) => (index + 1) * pixelSize)
    .filter((position) => position < height)

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setIsDraggingImage(false)
    const file = event.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) void onImageSelect(file)
  }

  return (
    <section
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-canvas-workspace shadow-sm"
      onDragEnter={(event) => {
        event.preventDefault()
        if (event.dataTransfer.types.includes('Files')) setIsDraggingImage(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDraggingImage(false)
      }}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2 text-xs text-muted-foreground">
        <span>畫布 · {width} × {height} px</span>
        <span>{columns} × {rows} 格 · {zoom}%</span>
      </div>

      <div className="canvas-workspace min-h-130 flex-1 overflow-auto">
        <div className="grid h-max min-h-full w-max min-w-full place-items-center p-10">
          <div
            className="relative box-content shrink-0 overflow-hidden border border-border-strong bg-canvas shadow-xl shadow-primary/20"
            style={{ width: displayWidth, height: displayHeight }}
          >
            <canvas
              ref={(canvas) => {
                canvasRef.current = canvas
                onCanvasReady(canvas)
              }}
              className="absolute inset-0 w-full h-full"
              style={{ imageRendering: 'pixelated' }}
              {...pointerHandlers}
            />
            {showGrid && (
              <svg
                className="pointer-events-none absolute inset-0 size-full"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {verticalLines.map((position) => (
                  <line
                    key={`vertical-${position}`}
                    x1={position}
                    y1={0}
                    x2={position}
                    y2={height}
                    stroke="var(--canvas-grid)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {horizontalLines.map((position) => (
                  <line
                    key={`horizontal-${position}`}
                    x1={0}
                    y1={position}
                    x2={width}
                    y2={position}
                    stroke="var(--canvas-grid)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>

      {isDraggingImage && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-card/50 p-6">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-secondary px-10 py-8 text-center shadow-lg">
            <Upload size={30} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-bold text-secondary-foreground">放開以匯入圖片</p>
          </div>
        </div>
      )}
    </section>
  )
}
