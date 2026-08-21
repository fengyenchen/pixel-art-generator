import { useState } from 'react'
import type { DragEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Upload } from 'lucide-react'
import type { PixelCanvasProps } from '../../types/canvas'
import { usePixelate } from '../../hooks/usePixelate'
import { useCanvasDraw } from '../../hooks/useCanvasDraw'

export default function PixelCanvas({ width, height, pixelSize, showGrid, zoom, sourceImage, paletteSize, cleanNoise, hasManualEdits, onCanvasReady, activeTool, color, onColorChange, onEditStart, onImageSelect, onProjectLoad, shapeSettings, selection, onSelectionChange }: PixelCanvasProps) {
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const canvasRef = usePixelate({ sourceImage, width, height, pixelSize, paletteSize, cleanNoise, hasManualEdits })
  const pointerHandlers = useCanvasDraw({ canvasRef, activeTool, color, pixelSize, onColorChange, onEditStart, shapeSettings, selection, onSelectionChange })
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
    if (!file) return

    if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
      void onProjectLoad(file)
    } else if (file.type.startsWith('image/')) {
      void onImageSelect(file)
    }
  }

  const handleWorkspacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'marquee' || !selection) return
    const target = event.target
    if (target instanceof Element && target.closest('canvas')) return
    onSelectionChange(null)
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

      <div className="canvas-workspace min-h-130 flex-1 overflow-auto" onPointerDown={handleWorkspacePointerDown}>
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
              className={`absolute inset-0 h-full w-full touch-none select-none ${activeTool === 'marquee' ? 'cursor-crosshair' : activeTool === 'move' ? 'cursor-move' : ''}`}
              style={{ imageRendering: 'pixelated', touchAction: 'none' }}
              {...pointerHandlers}
            />
            {(showGrid || (selection && (activeTool === 'marquee' || activeTool === 'move'))) && (
              <svg
                className="pointer-events-none absolute inset-0 size-full"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {showGrid && verticalLines.map((position) => (
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
                {showGrid && horizontalLines.map((position) => (
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
                {selection && (activeTool === 'marquee' || activeTool === 'move') && (
                  <>
                    <rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} fill="none" stroke="rgba(15,23,42,.85)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                    <rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} fill="rgba(255,255,255,.06)" stroke="white" strokeWidth={1} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  </>
                )}
              </svg>
            )}
          </div>
        </div>
      </div>

      {isDraggingImage && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-card/50 p-6">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-secondary px-10 py-8 text-center shadow-lg">
            <Upload size={30} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-bold text-secondary-foreground">放開以匯入圖片或專案</p>
          </div>
        </div>
      )}
    </section>
  )
}
