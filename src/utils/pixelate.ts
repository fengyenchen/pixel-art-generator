interface Color {
  red: number
  green: number
  blue: number
  alpha: number
}

interface PixelateSettings {
  paletteSize: number
  cleanNoise: boolean
}

const colorDistance = (first: Color, second: Color) => {
  const red = first.red - second.red
  const green = first.green - second.green
  const blue = first.blue - second.blue
  return red * red + green * green + blue * blue
}

function createPalette(colors: Color[], requestedSize: number) {
  const opaqueColors = colors.filter((color) => color.alpha > 8)
  if (opaqueColors.length === 0) return []

  const uniqueColors = [...new Map(opaqueColors.map((color) => [
    `${color.red},${color.green},${color.blue}`,
    color,
  ])).values()]

  const paletteSize = Math.min(requestedSize, uniqueColors.length)
  if (uniqueColors.length <= paletteSize) return uniqueColors

  const sortedColors = [...opaqueColors].sort((first, second) => {
    const firstLuminance = first.red * 0.2126 + first.green * 0.7152 + first.blue * 0.0722
    const secondLuminance = second.red * 0.2126 + second.green * 0.7152 + second.blue * 0.0722
    return firstLuminance - secondLuminance
  })

  let palette = Array.from({ length: paletteSize }, (_, index) => {
    const colorIndex = Math.min(
      sortedColors.length - 1,
      Math.floor(((index + 0.5) / paletteSize) * sortedColors.length),
    )
    return { ...sortedColors[colorIndex], alpha: 255 }
  })

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const totals = palette.map(() => ({ red: 0, green: 0, blue: 0, count: 0 }))

    for (const color of opaqueColors) {
      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      palette.forEach((paletteColor, index) => {
        const distance = colorDistance(color, paletteColor)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      totals[closestIndex].red += color.red
      totals[closestIndex].green += color.green
      totals[closestIndex].blue += color.blue
      totals[closestIndex].count += 1
    }

    palette = palette.map((color, index) => {
      const total = totals[index]
      if (total.count === 0) return color

      return {
        red: Math.round(total.red / total.count),
        green: Math.round(total.green / total.count),
        blue: Math.round(total.blue / total.count),
        alpha: 255,
      }
    })
  }

  return palette
}

function findClosestPaletteColor(color: Color, palette: Color[]) {
  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  palette.forEach((paletteColor, index) => {
    const distance = colorDistance(color, paletteColor)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  return closestIndex
}

function cleanSingletons(indices: number[], columns: number, rows: number) {
  const cleanedIndices = [...indices]

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const currentPosition = row * columns + column
      const currentColor = indices[currentPosition]
      if (currentColor < 0) continue

      const neighborCounts = new Map<number, number>()
      let hasMatchingNeighbor = false

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue

          const neighborColumn = column + offsetX
          const neighborRow = row + offsetY
          if (neighborColumn < 0 || neighborColumn >= columns || neighborRow < 0 || neighborRow >= rows) continue

          const neighborColor = indices[neighborRow * columns + neighborColumn]
          if (neighborColor < 0) continue
          if (neighborColor === currentColor) hasMatchingNeighbor = true
          neighborCounts.set(neighborColor, (neighborCounts.get(neighborColor) ?? 0) + 1)
        }
      }

      if (hasMatchingNeighbor) continue

      let replacement = currentColor
      let replacementCount = 0
      neighborCounts.forEach((count, colorIndex) => {
        if (count > replacementCount) {
          replacement = colorIndex
          replacementCount = count
        }
      })

      if (replacementCount >= 3) cleanedIndices[currentPosition] = replacement
    }
  }

  return cleanedIndices
}

export function drawPixelatedImage(
  sourceImage: CanvasImageSource,
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  pixelSize: number,
  settings: PixelateSettings,
) {
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = width
  sourceCanvas.height = height

  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  const targetContext = targetCanvas.getContext('2d')
  if (!sourceContext || !targetContext) return

  sourceContext.drawImage(sourceImage, 0, 0, width, height)
  const sourcePixels = sourceContext.getImageData(0, 0, width, height).data
  const columns = Math.ceil(width / pixelSize)
  const rows = Math.ceil(height / pixelSize)
  const blockColors: Color[] = []

  for (let blockY = 0; blockY < height; blockY += pixelSize) {
    const blockHeight = Math.min(pixelSize, height - blockY)

    for (let blockX = 0; blockX < width; blockX += pixelSize) {
      const blockWidth = Math.min(pixelSize, width - blockX)
      let red = 0
      let green = 0
      let blue = 0
      let alpha = 0
      const count = blockWidth * blockHeight

      for (let y = 0; y < blockHeight; y += 1) {
        for (let x = 0; x < blockWidth; x += 1) {
          const pixelIndex = ((blockY + y) * width + blockX + x) * 4
          red += sourcePixels[pixelIndex]
          green += sourcePixels[pixelIndex + 1]
          blue += sourcePixels[pixelIndex + 2]
          alpha += sourcePixels[pixelIndex + 3]
        }
      }

      blockColors.push({
        red: Math.round(red / count),
        green: Math.round(green / count),
        blue: Math.round(blue / count),
        alpha: Math.round(alpha / count),
      })
    }
  }

  const palette = createPalette(blockColors, settings.paletteSize)
  let paletteIndices = blockColors.map((color) => (
    color.alpha <= 8 || palette.length === 0 ? -1 : findClosestPaletteColor(color, palette)
  ))

  if (settings.cleanNoise) {
    paletteIndices = cleanSingletons(paletteIndices, columns, rows)
  }

  const outputData = targetContext.createImageData(width, height)

  blockColors.forEach((blockColor, blockIndex) => {
    const column = blockIndex % columns
    const row = Math.floor(blockIndex / columns)
    const blockX = column * pixelSize
    const blockY = row * pixelSize
    const blockWidth = Math.min(pixelSize, width - blockX)
    const blockHeight = Math.min(pixelSize, height - blockY)
    const paletteIndex = paletteIndices[blockIndex]
    const color = paletteIndex < 0 ? { red: 0, green: 0, blue: 0, alpha: 0 } : {
      ...palette[paletteIndex],
      alpha: blockColor.alpha,
    }

    for (let y = 0; y < blockHeight; y += 1) {
      for (let x = 0; x < blockWidth; x += 1) {
        const pixelIndex = ((blockY + y) * width + blockX + x) * 4
        outputData.data[pixelIndex] = color.red
        outputData.data[pixelIndex + 1] = color.green
        outputData.data[pixelIndex + 2] = color.blue
        outputData.data[pixelIndex + 3] = color.alpha
      }
    }
  })

  targetContext.putImageData(outputData, 0, 0)
}
