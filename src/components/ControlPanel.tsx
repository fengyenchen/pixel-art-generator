import { Grid3X3, SlidersHorizontal } from 'lucide-react'
import type { ControlPanelProps, RangeRowProps } from '../types/controlPanel'
import { Slider } from '@/components/ui/Slider'

const canvasDimensions = Array.from({ length: 64 }, (_, index) => (index + 1) * 4)
const commonCanvasSizes = [16, 32, 64, 128]

function RangeRow({ label, value, min, max, step = 1, suffix = '', onChange }: RangeRowProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}<span className="font-mono text-subtle-foreground">{value}{suffix}</span>
      </span>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(nextValue) => onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue)}
      />
    </label>
  )
}

export default function ControlPanel({ canvasWidth, canvasHeight, pixelSize, zoom, showGrid, paletteSize, cleanNoise, onCanvasWidthChange, onCanvasHeightChange, onPixelSizeChange, onZoomChange, onGridChange, onPaletteSizeChange, onCleanNoiseChange }: ControlPanelProps) {
  return (
    <aside className="col-span-2 w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm xl:col-span-1 xl:w-72">
      <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-4">
        <SlidersHorizontal size={17} className="text-muted-foreground" />
        <h2 className="text-sm font-bold">設定</h2>
      </div>

      <div className="space-y-6 p-5">
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">畫布尺寸</p>
          <div className="mb-3 grid grid-cols-4 gap-1">
            {commonCanvasSizes.map((size) => {
              const isActive = canvasWidth === size && canvasHeight === size

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onCanvasWidthChange(size)
                    onCanvasHeightChange(size)
                  }}
                  className={`rounded-md border px-1 py-1 text-[10px] font-medium transition ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <label className="text-xs text-subtle-foreground">
              寬度
              <select value={canvasWidth} onChange={(event) => onCanvasWidthChange(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm text-secondary-foreground outline-none transition focus:border-ring">
                {canvasDimensions.map((dimension) => (
                  <option key={dimension} value={dimension}>{dimension} px</option>
                ))}
              </select>
            </label>
            <span className="pb-2 text-sm text-subtle-foreground">×</span>
            <label className="text-xs text-subtle-foreground">
              高度
              <select value={canvasHeight} onChange={(event) => onCanvasHeightChange(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm text-secondary-foreground outline-none transition focus:border-ring">
                {canvasDimensions.map((dimension) => (
                  <option key={dimension} value={dimension}>{dimension} px</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <RangeRow label="像素區塊" value={pixelSize} min={4} max={32} step={4} suffix=" px" onChange={onPixelSizeChange} />
          <RangeRow label="色彩數量" value={paletteSize} min={2} max={64} step={1} suffix=" 色" onChange={onPaletteSizeChange} />
          <RangeRow label="縮放比例" value={zoom} min={100} max={1600} step={25} suffix="%" onChange={onZoomChange} />
        </section>

        <div className="h-px bg-border-subtle" />
        
        <label className="flex cursor-pointer items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-secondary-foreground"><Grid3X3 size={16} /> 顯示網格</span>
          <input type="checkbox" checked={showGrid} onChange={(event) => onGridChange(event.target.checked)} className="size-4 accent-primary" />
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-secondary-foreground">整理孤立色塊</span>
          <input type="checkbox" checked={cleanNoise} onChange={(event) => onCleanNoiseChange(event.target.checked)} className="size-4 accent-primary" />
        </label>
      </div>
    </aside>
  )
}
