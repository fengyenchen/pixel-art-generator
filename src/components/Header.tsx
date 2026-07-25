import { Blocks, Undo2, Redo2, ImagePlus, Download } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { HeaderProps } from '../types/header'

const iconButton = 'grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-40'

export default function Header({ imageName, onImageSelect, onExport, canExport }: HeaderProps) {
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onImageSelect(file)
    event.target.value = ''
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 text-card-foreground backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <Blocks size={18} fill="currentColor" />
        </div>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">Pixel Art Generator</h1>
          <p className="hidden max-w-52 truncate text-xs text-subtle-foreground sm:block">{imageName ?? 'Untitled work'}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className={iconButton} title="復原" disabled><Undo2 size={18} /></button>
        <button className={iconButton} title="重做" disabled><Redo2 size={18} /></button>
        <div className="mx-2 hidden h-6 w-px bg-border sm:block" />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition hover:bg-accent">
          <ImagePlus size={16} /> <span className="hidden sm:inline">匯入圖片</span>
          <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
        </label>
        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="ml-1 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={16} /> <span className="hidden sm:inline">匯出 PNG</span>
        </button>
      </div>
    </header>
  )
}
