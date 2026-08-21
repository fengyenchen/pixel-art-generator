import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Check, Crop, Download, RotateCcw, X } from 'lucide-react'
import type { CropAspect, CropRect } from '../types/crop'

interface CropEditorProps {
  image: ImageBitmap
  imageName: string
  onCancel: () => void
  onApply: (crop: CropRect) => Promise<void>
  onDownload: (crop: CropRect) => Promise<void>
}

type DragState = {
  action: 'move' | 'resize'
  corner?: 'nw' | 'ne' | 'sw' | 'se'
  clientX: number
  clientY: number
  crop: CropRect
}

const aspects: Array<{ id: CropAspect; label: string; ratio?: number }> = [
  { id: 'free', label: '自由' },
  { id: '1:1', label: '1 : 1', ratio: 1 },
  { id: '4:3', label: '4 : 3', ratio: 4 / 3 },
  { id: '16:9', label: '16 : 9', ratio: 16 / 9 },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function cropForAspect(image: ImageBitmap, ratio?: number): CropRect {
  if (!ratio) return { x: 0, y: 0, width: image.width, height: image.height }

  const imageRatio = image.width / image.height
  const width = imageRatio > ratio ? image.height * ratio : image.width
  const height = imageRatio > ratio ? image.height : image.width / ratio
  return { x: (image.width - width) / 2, y: (image.height - height) / 2, width, height }
}

export default function CropEditor({ image, imageName, onCancel, onApply, onDownload }: CropEditorProps) {
  const [aspect, setAspect] = useState<CropAspect>('free')
  const [crop, setCrop] = useState<CropRect>(() => cropForAspect(image))
  const [drag, setDrag] = useState<DragState | null>(null)
  const [busyAction, setBusyAction] = useState<'apply' | 'download' | null>(null)
  const [actionError, setActionError] = useState<string>()
  const [workspaceSize, setWorkspaceSize] = useState({ width: 960, height: 560 })
  const workspaceRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewSize = useMemo(() => {
    const availableWidth = Math.min(960, workspaceSize.width * 0.92)
    const availableHeight = Math.min(560, workspaceSize.height * 0.92)
    const scale = Math.min(1, availableWidth / image.width, availableHeight / image.height)
    return { width: Math.round(image.width * scale), height: Math.round(image.height * scale) }
  }, [image, workspaceSize])

  useLayoutEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    const updateSize = () => {
      const styles = getComputedStyle(workspace)
      const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
      const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
      setWorkspaceSize({
        width: Math.max(1, workspace.clientWidth - horizontalPadding),
        height: Math.max(1, workspace.clientHeight - verticalPadding),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(workspace)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    canvas.width = previewSize.width
    canvas.height = previewSize.height
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }, [image, previewSize])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !busyAction) onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [busyAction, onCancel])

  const getScale = () => {
    const bounds = viewportRef.current?.getBoundingClientRect()
    return bounds ? { x: image.width / bounds.width, y: image.height / bounds.height } : { x: 1, y: 1 }
  }

  const beginDrag = (event: ReactPointerEvent, action: DragState['action'], corner?: DragState['corner']) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ action, corner, clientX: event.clientX, clientY: event.clientY, crop })
  }

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (!drag) return
    const scale = getScale()
    const dx = (event.clientX - drag.clientX) * scale.x
    const dy = (event.clientY - drag.clientY) * scale.y

    if (drag.action === 'move') {
      setCrop({
        ...drag.crop,
        x: clamp(drag.crop.x + dx, 0, image.width - drag.crop.width),
        y: clamp(drag.crop.y + dy, 0, image.height - drag.crop.height),
      })
      return
    }

    const corner = drag.corner ?? 'se'
    const fromLeft = corner.includes('w')
    const fromTop = corner.includes('n')
    const anchorX = fromLeft ? drag.crop.x + drag.crop.width : drag.crop.x
    const anchorY = fromTop ? drag.crop.y + drag.crop.height : drag.crop.y
    const pointerX = clamp((fromLeft ? drag.crop.x : drag.crop.x + drag.crop.width) + dx, 0, image.width)
    const pointerY = clamp((fromTop ? drag.crop.y : drag.crop.y + drag.crop.height) + dy, 0, image.height)
    let width = Math.max(24, Math.abs(anchorX - pointerX))
    let height = Math.max(24, Math.abs(anchorY - pointerY))
    const ratio = aspects.find((item) => item.id === aspect)?.ratio

    if (ratio) {
      if (Math.abs(dx) / image.width >= Math.abs(dy) / image.height) height = width / ratio
      else width = height * ratio
    }

    width = Math.min(width, fromLeft ? anchorX : image.width - anchorX)
    height = Math.min(height, fromTop ? anchorY : image.height - anchorY)
    if (ratio) {
      width = Math.min(width, height * ratio)
      height = width / ratio
    }

    setCrop({
      x: fromLeft ? anchorX - width : anchorX,
      y: fromTop ? anchorY - height : anchorY,
      width,
      height,
    })
  }

  const handleSelectionKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const distance = event.shiftKey ? 10 : 1
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-distance, 0], ArrowRight: [distance, 0], ArrowUp: [0, -distance], ArrowDown: [0, distance],
    }
    const delta = movement[event.key]
    if (!delta) return
    event.preventDefault()
    setCrop((current) => ({
      ...current,
      x: clamp(current.x + delta[0], 0, image.width - current.width),
      y: clamp(current.y + delta[1], 0, image.height - current.height),
    }))
  }

  const runAction = async (action: 'apply' | 'download') => {
    setBusyAction(action)
    setActionError(undefined)
    try {
      if (action === 'apply') await onApply(crop)
      else await onDownload(crop)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '圖片處理失敗，請再試一次')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-card shadow-2xl sm:h-[calc(100dvh-2.5rem)] sm:rounded-2xl sm:border sm:border-border">
        <header className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="crop-title" className="flex items-center gap-2 text-base font-bold"><Crop size={19} /> 裁切原始圖片</h2>
            <p className="truncate text-xs text-muted-foreground">{imageName} · {image.width} × {image.height} px</p>
          </div>
          <button type="button" onClick={onCancel} disabled={Boolean(busyAction)} className="grid size-11 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label="關閉裁切工具"><X size={20} /></button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:overflow-hidden">
          <div ref={workspaceRef} className="flex min-h-80 flex-1 items-center justify-center overflow-hidden bg-canvas-workspace p-4 sm:min-h-0 sm:p-8">
            <div
              ref={viewportRef}
              className="relative w-full overflow-hidden bg-slate-900 shadow-xl"
              style={{ width: previewSize.width, maxWidth: '100%', aspectRatio: `${image.width} / ${image.height}` }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDrag(null)}
              onPointerCancel={() => setDrag(null)}
            >
              <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-label="待裁切的原始圖片" />
              <div
                className="absolute touch-none cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(2,6,23,0.62)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ left: `${crop.x / image.width * 100}%`, top: `${crop.y / image.height * 100}%`, width: `${crop.width / image.width * 100}%`, height: `${crop.height / image.height * 100}%` }}
                onPointerDown={(event) => beginDrag(event, 'move')}
                onKeyDown={handleSelectionKeyDown}
                role="group"
                tabIndex={0}
                aria-label="裁切範圍，可拖曳或使用方向鍵移動"
              >
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }, (_, index) => <span key={index} className="border-white/45 [&:not(:nth-child(3n))]:border-r [&:nth-child(-n+6)]:border-b" />)}
                </div>
                {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                  <button
                    key={corner}
                    type="button"
                    aria-label={`${corner} 裁切控制點`}
                    onPointerDown={(event) => beginDrag(event, 'resize', corner)}
                    className={`absolute size-6 touch-none rounded-full border-2 border-white bg-primary shadow-md ${corner.includes('n') ? '-top-3' : '-bottom-3'} ${corner.includes('w') ? '-left-3' : '-right-3'} cursor-${corner}-resize`}
                  />
                ))}
                <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-slate-950/75 px-2 py-1 text-[11px] font-medium text-white">
                  {Math.round(crop.width)} × {Math.round(crop.height)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2" aria-label="裁切比例">
                <span className="mr-1 text-xs font-medium text-muted-foreground">比例</span>
                {aspects.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setAspect(item.id); setCrop(cropForAspect(image, item.ratio)) }} className={`min-h-11 rounded-xl border px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${aspect === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-secondary-foreground hover:bg-accent'}`}>
                    {item.label}
                  </button>
                ))}
                <button type="button" onClick={() => setCrop(cropForAspect(image, aspects.find((item) => item.id === aspect)?.ratio))} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"><RotateCcw size={16} /> 重設</button>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" disabled={Boolean(busyAction)} onClick={() => void runAction('download')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-accent disabled:cursor-wait disabled:opacity-50"><Download size={17} /> {busyAction === 'download' ? '正在輸出…' : '直接下載 PNG'}</button>
                <button type="button" disabled={Boolean(busyAction)} onClick={() => void runAction('apply')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-50"><Check size={17} /> {busyAction === 'apply' ? '正在處理…' : '套用並像素化'}</button>
              </div>
            </div>
            {actionError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{actionError}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
