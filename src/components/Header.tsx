import { Blocks, Undo2, Redo2, ImagePlus, Download, CircleHelp, FolderOpen, Save, Crop } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { HeaderProps } from '../types/header'

const iconButton = 'grid h-11 w-full place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-40 sm:size-9'

export default function Header({ imageName, onImageSelect, onOpenCrop, canCrop, onExport, canExport, onUndo, onRedo, canUndo, canRedo, onOpenHelp, onSaveProject, onLoadProject }: HeaderProps) {
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void onImageSelect(file)
    event.target.value = ''
  }

  const handleProjectChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void onLoadProject(file)
    event.target.value = ''
  }

  return (
    <header className="flex min-h-16 w-full flex-wrap items-center justify-between border-b border-border bg-card/90 px-4 py-3 text-card-foreground backdrop-blur lg:h-16 lg:flex-nowrap lg:px-6 lg:py-0">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <Blocks size={18} fill="currentColor" />
        </div>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">Pixel Art Generator</h1>
          <p className="hidden max-w-52 truncate text-xs text-subtle-foreground sm:block">{imageName ?? 'Untitled work'}</p>
        </div>
      </div>

      <div className="mt-3 grid w-full grid-cols-6 items-center gap-1 border-t border-border-subtle pt-3 sm:flex sm:justify-between lg:mt-0 lg:w-auto lg:justify-start lg:border-0 lg:pt-0">
        <button type="button" className={iconButton} title="使用說明" onClick={onOpenHelp}><CircleHelp size={18} /></button>
        <button type="button" className={iconButton} title="儲存專案" onClick={onSaveProject}><Save size={18} /></button>
        <label className={`${iconButton} cursor-pointer`} title="載入專案">
          <FolderOpen size={18} />
          <input type="file" accept=".json,application/json" onChange={handleProjectChange} className="sr-only" />
        </label>
        <button type="button" className={iconButton} title="復原 (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}><Undo2 size={18} /></button>
        <button type="button" className={iconButton} title="重做 (Ctrl+Y)" onClick={onRedo} disabled={!canRedo}><Redo2 size={18} /></button>
        <button type="button" className={iconButton} title="重新裁切原圖" aria-label="重新裁切原圖" onClick={onOpenCrop} disabled={!canCrop}><Crop size={18} /></button>
        <div className="mx-2 hidden h-6 w-px bg-border lg:block" />
        <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-0 text-md font-medium text-secondary-foreground shadow-sm transition hover:bg-accent sm:h-9 sm:w-9 lg:w-30 lg:px-3">
          <ImagePlus size={16} /> <span className="hidden lg:inline">匯入圖片</span>
          <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
        </label>
        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-0 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 sm:ml-1 sm:h-9 sm:w-9 lg:w-32.5 lg:px-3"
        >
          <Download size={16} /> <span className="hidden lg:inline">匯出 PNG</span>
        </button>
      </div>
    </header>
  )
}
