export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('無法建立 PNG 圖片'))
        return
      }

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.click()
      URL.revokeObjectURL(downloadUrl)
      resolve()
    }, 'image/png')
  })
}
