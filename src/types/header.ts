export interface HeaderProps {
  imageName?: string
  onImageSelect: (file: File) => Promise<void>
  onExport: () => void
  canExport: boolean
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}
