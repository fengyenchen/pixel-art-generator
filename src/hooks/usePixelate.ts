import { useEffect, useRef } from 'react'
import type { UsePixelateOptions } from '../types/canvas'
import { drawPixelatedImage } from '../utils/pixelate'

export function usePixelate({ sourceImage, width, height, pixelSize, paletteSize, cleanNoise, hasManualEdits }: UsePixelateOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef({ pixelSize, paletteSize, cleanNoise })
  settingsRef.current = { pixelSize, paletteSize, cleanNoise }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return

    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, width, height)

    if (sourceImage) {
      const settings = settingsRef.current
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
