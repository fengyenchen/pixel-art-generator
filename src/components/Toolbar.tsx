import { useState } from 'react'
import { MousePointer2, Pencil, Eraser, PaintBucket, Pipette, Trash2, Shapes, Square, Circle, Minus } from 'lucide-react'
import type { ToolOption, ToolbarProps } from '../types/toolbar'
import type { ShapeKind, ShapeStyle } from '../types/editor'
import { SketchPicker } from 'react-color';
import { Slider } from './ui/Slider'

const tools: ToolOption[] = [
    { id: 'select', label: '選取', icon: MousePointer2 },
    { id: 'pencil', label: '鉛筆', icon: Pencil },
    { id: 'eraser', label: '橡皮擦', icon: Eraser },
    { id: 'fill', label: '填色', icon: PaintBucket },
    { id: 'eyedropper', label: '吸管', icon: Pipette },
    { id: 'shape', label: '基本圖形', icon: Shapes },
]

const shapeOptions: Array<{ id: ShapeKind; label: string; icon: typeof Square }> = [
    { id: 'rectangle', label: '矩形', icon: Square },
    { id: 'ellipse', label: '橢圓', icon: Circle },
    { id: 'line', label: '直線', icon: Minus },
]

const styleOptions: Array<{ id: ShapeStyle; label: string }> = [
    { id: 'fill', label: '填色' },
    { id: 'outline', label: '框線' },
]

export default function Toolbar({ activeTool, color, onToolChange, onColorChange, onClear, shapeKind, shapeStyle, shapeStrokeWidth, onShapeKindChange, onShapeStyleChange, onShapeStrokeWidthChange }: ToolbarProps) {
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
    const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false)

    return (
        <aside className="flex flex-col items-center w-16 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <div className="flex flex-col gap-1">
                {tools.map((tool) => (
                    <div key={tool.id} className="relative">
                        <button
                            type="button"
                            title={tool.label}
                            aria-label={tool.label}
                            aria-expanded={tool.id === 'shape' ? isShapeMenuOpen : undefined}
                            onClick={() => {
                                onToolChange(tool.id)
                                setIsColorPickerOpen(false)
                                setIsShapeMenuOpen(tool.id === 'shape' ? !isShapeMenuOpen : false)
                            }}
                            className={`grid size-11 place-items-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${activeTool === tool.id
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                        >
                            <tool.icon size={20} strokeWidth={2} />
                        </button>

                        {tool.id === 'shape' && isShapeMenuOpen && (
                            <>
                                <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="關閉圖形設定" onClick={() => setIsShapeMenuOpen(false)} />
                                <div className="absolute left-14 top-0 z-50 w-60 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl" role="dialog" aria-label="圖形設定">
                                    <div className="grid grid-cols-3 gap-2">
                                        {shapeOptions.map((option) => (
                                            <button key={option.id} type="button" title={option.label} aria-label={option.label} onClick={() => onShapeKindChange(option.id)} className={`grid min-h-11 place-items-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${shapeKind === option.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                                                <option.icon size={20} />
                                            </button>
                                        ))}
                                    </div>

                                    {shapeKind !== 'line' && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">樣式</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {styleOptions.map((option) => (
                                                    <button key={option.id} type="button" onClick={() => onShapeStyleChange(option.id)} className={`min-h-11 rounded-xl border text-sm font-medium transition ${shapeStyle === option.id ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-accent'}`}>{option.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(shapeKind === 'line' || shapeStyle === 'outline') && (
                                        <label className="mt-4 block">
                                            <p className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
                                                框線粗細 <span className="font-mono text-foreground">{shapeStrokeWidth} 格</span>
                                            </p>
                                            <Slider
                                                min={1}
                                                max={8}
                                                step={1}
                                                value={[shapeStrokeWidth]}
                                                onValueChange={(value) => onShapeStrokeWidthChange(Array.isArray(value) ? value[0] : value)}
                                            />
                                        </label>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="my-3 h-px w-8 bg-border" />
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => { setIsColorPickerOpen(!isColorPickerOpen); setIsShapeMenuOpen(false) }}
                    className="relative grid size-10 cursor-pointer place-items-center rounded-xl border border-border bg-card shadow-sm hover:border-border-strong transition-colors"
                    title="目前顏色"
                >
                    <span className="size-7 rounded-lg border-2 border-primary-foreground shadow" style={{ backgroundColor: color }} />
                </button>

                {/* 點擊外部區域關閉選色盤 */}
                {isColorPickerOpen && (
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsColorPickerOpen(false)}
                    />
                )}

                {isColorPickerOpen && (
                    <div className="absolute left-14 -top-14 z-50">
                        <SketchPicker
                            color={color}
                            onChange={(updatedColor) => onColorChange(updatedColor.hex)}
                        />
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onClear}
                className="mt-3 grid size-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-secondary-foreground"
                title="清空畫布"
                aria-label="清空畫布"
            >
                <Trash2 size={19} strokeWidth={2} />
            </button>
        </aside>
    )
}
