import { useEffect } from 'react'
import { Download, FolderOpen, ImagePlus, Keyboard, MousePointer2, SlidersHorizontal, X } from 'lucide-react'
import type { HelpModalProps } from '../types/helpModal'

const guides = [
  {
    icon: ImagePlus,
    title: '匯入圖片',
    description: '點擊頂部「匯入圖片」，或將圖片直接拖放到中央畫布區域。',
  },
  {
    icon: MousePointer2,
    title: '編輯畫布',
    description: '使用左側的鉛筆、橡皮擦、填色與吸管工具編輯每個像素區塊。垃圾桶可一鍵清空畫布。',
  },
  {
    icon: SlidersHorizontal,
    title: '調整設定',
    description: '右側可調整畫布尺寸、像素區塊、色彩數量、縮放比例及網格顯示。縮小畫布時會置中裁切內容。',
  },
  {
    icon: Keyboard,
    title: '復原與重做',
    description: '使用頂部按鈕，或按 Ctrl + Z 復原、Ctrl + Y 重做。畫布尺寸與清空操作也能復原。',
  },
  {
    icon: FolderOpen,
    title: '儲存與載入專案',
    description: '使用頂部的儲存圖示下載 .pixel-art.json；之後可用資料夾圖示或直接拖放到畫布載入，恢復內容、尺寸與設定。',
  },
  {
    icon: Download,
    title: '匯出作品',
    description: '完成後點擊「匯出 PNG」，下載保留清晰像素邊緣的圖片。',
  },
]

export default function HelpModal({ onClose }: HelpModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          aria-label="關閉使用說明"
        >
          <X size={18} />
        </button>

        <div className="mb-5 pr-10">
          <h2 id="help-title" className="text-lg font-bold">使用說明</h2>
          <p className="mt-1 text-sm text-muted-foreground">快速認識像素繪圖與圖片轉換工具。</p>
        </div>

        <div className="space-y-3">
          {guides.map((guide, index) => (
            <article key={guide.title} className="flex gap-3 rounded-xl border border-border-subtle bg-background p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <guide.icon size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold"><span className="mr-1 text-subtle-foreground">{index + 1}.</span>{guide.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{guide.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
