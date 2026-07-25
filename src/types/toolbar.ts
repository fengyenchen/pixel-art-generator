import type { LucideIcon } from 'lucide-react'
import type { EditorTool } from './editor'

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
}
