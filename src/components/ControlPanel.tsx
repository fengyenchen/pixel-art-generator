import { Grid3X3, SlidersHorizontal } from 'lucide-react'
import type { ControlPanelProps, RangeRowProps } from '../types/controlPanel'
import { Slider } from '@/components/ui/Slider'

function RangeRow({ label, value, min, max, suffix = '', onChange }: RangeRowProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}<span className="font-mono text-subtle-foreground">{value}{suffix}</span>
      </span>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(nextValue) => onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue)}
      />
    </label>
  )
}

export default function ControlPanel({ canvasWidth, canvasHeight, pixelSize, zoom, showGrid, onCanvasWidthChange, onCanvasHeightChange, onPixelSizeChange, onZoomChange, onGridChange }: ControlPanelProps) {
  const updateDimension = (rawValue: string, onChange: (value: number) => void) => {
    const value = Number(rawValue)
    if (Number.isFinite(value)) onChange(value)
  }

  return (
    <aside className="hidden w-72 rounded-2xl border border-border bg-card text-card-foreground shadow-sm xl:block">
      <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-4">
        <SlidersHorizontal size={17} className="text-muted-foreground" />
        <h2 className="text-sm font-bold">設定</h2>
      </div>

      <div className="space-y-6 p-5">
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">畫布尺寸</p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <label className="text-xs text-subtle-foreground">
              寬度
              <input type="number" value={canvasWidth} onChange={(event) => updateDimension(event.target.value, onCanvasWidthChange)} className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm text-secondary-foreground outline-none transition focus:border-ring" />
            </label>
            <span className="pb-2 text-sm text-subtle-foreground">×</span>
            <label className="text-xs text-subtle-foreground">
              高度
              <input type="number" value={canvasHeight} onChange={(event) => updateDimension(event.target.value, onCanvasHeightChange)} className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm text-secondary-foreground outline-none transition focus:border-ring" />
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <RangeRow label="像素區塊" value={pixelSize} min={4} max={32} suffix=" px" onChange={onPixelSizeChange} />
          <RangeRow label="縮放比例" value={zoom} min={50} max={125} suffix="%" onChange={onZoomChange} />
        </section>

        <div className="h-px bg-border-subtle" />
        
        <label className="flex cursor-pointer items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-secondary-foreground"><Grid3X3 size={16} /> 顯示網格</span>
          <input type="checkbox" checked={showGrid} onChange={(event) => onGridChange(event.target.checked)} className="size-4 accent-primary" />
        </label>
      </div>
    </aside>
  )
}
