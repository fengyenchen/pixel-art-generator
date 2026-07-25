import { useEffect, useRef } from 'react'
import type { UsePixelateOptions } from '../types/canvas'
import { drawPixelatedImage } from '../utils/pixelate'

export function usePixelate({ sourceImage, width, height, pixelSize, paletteSize, cleanNoise }: UsePixelateOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      drawPixelatedImage(sourceImage, canvas, width, height, pixelSize, { paletteSize, cleanNoise })
    }
  }, [sourceImage, width, height, pixelSize, paletteSize, cleanNoise])

  return canvasRef
}
