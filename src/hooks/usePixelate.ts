import { useEffect, useRef } from 'react'
import type { UsePixelateOptions } from '../types/canvas'
import { drawPixelatedImage } from '../utils/pixelate'

export function usePixelate({ sourceImage, width, height, pixelSize, paletteSize, cleanNoise, hasManualEdits }: UsePixelateOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef({ pixelSize, paletteSize, cleanNoise, hasManualEdits })
  settingsRef.current = { pixelSize, paletteSize, cleanNoise, hasManualEdits }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const settings = settingsRef.current
    const previousCanvas = document.createElement('canvas')
    previousCanvas.width = canvas.width
    previousCanvas.height = canvas.height
    const previousContext = previousCanvas.getContext('2d')
    if (settings.hasManualEdits) previousContext?.drawImage(canvas, 0, 0)

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return

    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, width, height)

    if (settings.hasManualEdits && previousContext) {
      const offsetX = Math.round((width - previousCanvas.width) / 2 / settings.pixelSize) * settings.pixelSize
      const offsetY = Math.round((height - previousCanvas.height) / 2 / settings.pixelSize) * settings.pixelSize
      context.drawImage(previousCanvas, offsetX, offsetY)
    } else if (sourceImage) {
      drawPixelatedImage(sourceImage, canvas, width, height, settings.pixelSize, settings)
    }
  }, [sourceImage, width, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImage || hasManualEdits) return

    drawPixelatedImage(sourceImage, canvas, width, height, pixelSize, { paletteSize, cleanNoise })
  }, [sourceImage, width, height, pixelSize, paletteSize, cleanNoise, hasManualEdits])

  return canvasRef
}
