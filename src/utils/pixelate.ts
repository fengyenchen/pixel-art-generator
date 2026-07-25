export function drawPixelatedImage(
  sourceImage: CanvasImageSource,
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  pixelSize: number,
) {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = width
  sourceCanvas.height = height

  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  const targetContext = targetCanvas.getContext('2d')

  if (!sourceContext || !targetContext) return

  sourceContext.clearRect(0, 0, width, height)
  sourceContext.drawImage(sourceImage, 0, 0, width, height)

  const sourceData = sourceContext.getImageData(0, 0, width, height)
  const outputData = targetContext.createImageData(width, height)
  const sourcePixels = sourceData.data
  const outputPixels = outputData.data

  for (let blockY = 0; blockY < height; blockY += pixelSize) {
    const blockHeight = Math.min(pixelSize, height - blockY)

    for (let blockX = 0; blockX < width; blockX += pixelSize) {
      const blockWidth = Math.min(pixelSize, width - blockX)
      let red = 0
      let green = 0
      let blue = 0
      let alpha = 0
      let count = 0

      for (let y = 0; y < blockHeight; y += 1) {
        for (let x = 0; x < blockWidth; x += 1) {
          const pixelIndex = ((blockY + y) * width + blockX + x) * 4
          red += sourcePixels[pixelIndex]
          green += sourcePixels[pixelIndex + 1]
          blue += sourcePixels[pixelIndex + 2]
          alpha += sourcePixels[pixelIndex + 3]
          count += 1
        }
      }

      const averageRed = Math.round(red / count)
      const averageGreen = Math.round(green / count)
      const averageBlue = Math.round(blue / count)
      const averageAlpha = Math.round(alpha / count)

      for (let y = 0; y < blockHeight; y += 1) {
        for (let x = 0; x < blockWidth; x += 1) {
          const pixelIndex = ((blockY + y) * width + blockX + x) * 4
          outputPixels[pixelIndex] = averageRed
          outputPixels[pixelIndex + 1] = averageGreen
          outputPixels[pixelIndex + 2] = averageBlue
          outputPixels[pixelIndex + 3] = averageAlpha
        }
      }
    }
  }

  targetContext.clearRect(0, 0, width, height)
  targetContext.putImageData(outputData, 0, 0)
}
