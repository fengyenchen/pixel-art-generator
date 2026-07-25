export interface HeaderProps {
  imageName?: string
  onImageSelect: (file: File) => void
  onExport: () => void
  canExport: boolean
}
