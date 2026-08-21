import type { CropRect } from '../types/crop'

function drawCrop(image: ImageBitmap, crop: CropRect) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(crop.width))
  canvas.height = Math.max(1, Math.round(crop.height))
  const context = canvas.getContext('2d')

  if (!context) throw new Error('無法建立裁切畫布')

  context.drawImage(
    image,
    Math.round(crop.x),
    Math.round(crop.y),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return canvas
}

export async function cropImageBitmap(image: ImageBitmap, crop: CropRect) {
  return createImageBitmap(drawCrop(image, crop))
}

export function downloadCroppedImage(image: ImageBitmap, crop: CropRect, filename: string) {
  const canvas = drawCrop(image, crop)

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('無法建立裁切圖片'))
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}
