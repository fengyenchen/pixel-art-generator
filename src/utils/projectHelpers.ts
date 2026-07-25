import type { PixelArtProject, PixelArtProjectSettings } from '../types/project'

const PROJECT_FORMAT = 'pixel-art-generator'

const isPositiveNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0
const isCanvasDimension = (value: unknown): value is number => (
  typeof value === 'number'
  && Number.isInteger(value)
  && value > 0
  && value <= 256
  && value % 4 === 0
)

export function downloadProject(
  canvas: HTMLCanvasElement,
  settings: PixelArtProjectSettings,
  filename: string,
) {
  const project: PixelArtProject = {
    format: PROJECT_FORMAT,
    canvas: {
      width: canvas.width,
      height: canvas.height,
      pixelData: canvas.toDataURL('image/png'),
    },
    settings,
  }

  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function readProject(file: File): Promise<PixelArtProject> {
  let project: unknown

  try {
    project = JSON.parse(await file.text())
  } catch {
    throw new Error('專案檔案不是有效的 JSON')
  }

  if (!project || typeof project !== 'object') throw new Error('專案檔案格式不正確')
  const candidate = project as Partial<PixelArtProject>

  if (candidate.format !== PROJECT_FORMAT) {
    throw new Error('不是有效的像素繪圖專案檔')
  }

  const canvas = candidate.canvas
  const settings = candidate.settings
  if (
    !canvas
    || !isCanvasDimension(canvas.width)
    || !isCanvasDimension(canvas.height)
    || typeof canvas.pixelData !== 'string'
    || !canvas.pixelData.startsWith('data:image/png;base64,')
    || !settings
    || !isPositiveNumber(settings.pixelSize)
    || !isPositiveNumber(settings.paletteSize)
    || !isPositiveNumber(settings.zoom)
    || typeof settings.showGrid !== 'boolean'
    || typeof settings.cleanNoise !== 'boolean'
    || typeof settings.color !== 'string'
    || !/^#[0-9a-f]{6}$/i.test(settings.color)
  ) {
    throw new Error('專案檔案缺少必要資料')
  }

  return candidate as PixelArtProject
}

export async function projectPixelsToImage(pixelData: string) {
  const response = await fetch(pixelData)
  return createImageBitmap(await response.blob())
}
