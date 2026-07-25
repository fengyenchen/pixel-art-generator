interface Color {
  red: number
  green: number
  blue: number
  alpha: number
}

interface OklabColor {
  lightness: number
  greenRed: number
  blueYellow: number
}

interface PaletteColor extends Color, OklabColor {}

interface PixelateSettings {
  paletteSize: number
  cleanNoise: boolean
}

const toLinearRgb = (channel: number) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const toSrgb = (channel: number) => {
  const value = channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055

  return Math.round(Math.min(1, Math.max(0, value)) * 255)
}

function rgbToOklab(color: Color): OklabColor {
  const red = toLinearRgb(color.red)
  const green = toLinearRgb(color.green)
  const blue = toLinearRgb(color.blue)

  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)

  return {
    lightness: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    greenRed: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    blueYellow: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  }
}

function oklabToRgb(color: OklabColor): Color {
  const longRoot = color.lightness + 0.3963377774 * color.greenRed + 0.2158037573 * color.blueYellow
  const mediumRoot = color.lightness - 0.1055613458 * color.greenRed - 0.0638541728 * color.blueYellow
  const shortRoot = color.lightness - 0.0894841775 * color.greenRed - 1.291485548 * color.blueYellow

  const long = longRoot ** 3
  const medium = mediumRoot ** 3
  const short = shortRoot ** 3

  return {
    red: toSrgb(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
    green: toSrgb(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
    blue: toSrgb(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short),
    alpha: 255,
  }
}

const oklabDistance = (first: OklabColor, second: OklabColor) => {
  const lightness = first.lightness - second.lightness
  const greenRed = first.greenRed - second.greenRed
  const blueYellow = first.blueYellow - second.blueYellow
  return lightness * lightness + greenRed * greenRed + blueYellow * blueYellow
}

function createPalette(colors: Color[], requestedSize: number) {
  const opaqueColors = colors.filter((color) => color.alpha > 8)
  if (opaqueColors.length === 0) return []

  const uniqueColors = [...new Map(opaqueColors.map((color) => [
    `${color.red},${color.green},${color.blue}`,
    color,
  ])).values()]

  const paletteSize = Math.min(requestedSize, uniqueColors.length)
  if (uniqueColors.length <= paletteSize) {
    return uniqueColors.map((color): PaletteColor => ({ ...color, ...rgbToOklab(color) }))
  }

  const labColors = opaqueColors.map((color) => rgbToOklab(color))
  const sortedColors = [...labColors].sort((first, second) => first.lightness - second.lightness)

  let palette = Array.from({ length: paletteSize }, (_, index) => {
    const colorIndex = Math.min(
      sortedColors.length - 1,
      Math.floor(((index + 0.5) / paletteSize) * sortedColors.length),
    )
    return { ...sortedColors[colorIndex] }
  })

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const totals = palette.map(() => ({ lightness: 0, greenRed: 0, blueYellow: 0, count: 0 }))

    for (const color of labColors) {
      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      palette.forEach((paletteColor, index) => {
        const distance = oklabDistance(color, paletteColor)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      totals[closestIndex].lightness += color.lightness
      totals[closestIndex].greenRed += color.greenRed
      totals[closestIndex].blueYellow += color.blueYellow
      totals[closestIndex].count += 1
    }

    palette = palette.map((color, index) => {
      const total = totals[index]
      if (total.count === 0) return color

      return {
        lightness: total.lightness / total.count,
        greenRed: total.greenRed / total.count,
        blueYellow: total.blueYellow / total.count,
      }
    })
  }

  return palette.map((color): PaletteColor => ({ ...oklabToRgb(color), ...color }))
}

function findClosestPaletteColor(color: Color, palette: PaletteColor[]) {
  const labColor = rgbToOklab(color)
  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  palette.forEach((paletteColor, index) => {
    const distance = oklabDistance(labColor, paletteColor)
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
