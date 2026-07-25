import { useState } from 'react'
import { MousePointer2, Pencil, Eraser, PaintBucket, Pipette, Trash2 } from 'lucide-react'
import type { ToolOption, ToolbarProps } from '../types/toolbar'
import { SketchPicker } from 'react-color';

const tools: ToolOption[] = [
    { id: 'select', label: '選取', icon: MousePointer2 },
    { id: 'pencil', label: '鉛筆', icon: Pencil },
    { id: 'eraser', label: '橡皮擦', icon: Eraser },
    { id: 'fill', label: '填色', icon: PaintBucket },
    { id: 'eyedropper', label: '吸管', icon: Pipette },
]

export default function Toolbar({ activeTool, color, onToolChange, onColorChange, onClear }: ToolbarProps) {
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

    return (
        <aside className="flex flex-col items-center w-16 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <div className="flex flex-col gap-1">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        title={tool.label}
                        onClick={() => onToolChange(tool.id)}
                        className={`grid size-11 place-items-center rounded-xl transition ${activeTool === tool.id
                                ? 'bg-secondary text-secondary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            }`}
                    >
                        <tool.icon size={20} strokeWidth={2} />
                    </button>
                ))}
            </div>

            <div className="my-3 h-px w-8 bg-border" />
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
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
