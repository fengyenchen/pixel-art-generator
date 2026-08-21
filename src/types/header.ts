export interface HeaderProps {
  imageName?: string
  onImageSelect: (file: File) => Promise<void>
  onOpenCrop: () => void
  canCrop: boolean
  onExport: () => void
  canExport: boolean
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onOpenHelp: () => void
  onSaveProject: () => void
  onLoadProject: (file: File) => Promise<void>
}
