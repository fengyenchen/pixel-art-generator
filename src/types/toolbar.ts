import type { LucideIcon } from 'lucide-react'
import type { EditorTool, ShapeKind, ShapeStyle } from './editor'

export interface ToolOption {
  id: EditorTool
  label: string
  icon: LucideIcon
}

export interface ToolbarProps {
  activeTool: EditorTool
  color: string
  onToolChange: (tool: EditorTool) => void
  onColorChange: (color: string) => void
  onClear: () => void
  shapeKind: ShapeKind
  shapeStyle: ShapeStyle
  shapeStrokeWidth: number
  onShapeKindChange: (kind: ShapeKind) => void
  onShapeStyleChange: (style: ShapeStyle) => void
  onShapeStrokeWidthChange: (width: number) => void
}
