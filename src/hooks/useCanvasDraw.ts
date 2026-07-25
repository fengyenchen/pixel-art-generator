import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CanvasPointerHandlers, UseCanvasDrawOptions } from '../types/canvasDraw'

interface CanvasPoint {
  x: number
  y: number
  blockX: number
  blockY: number
}

const rgbaMatches = (data: Uint8ClampedArray, index: number, color: number[]) => (
  data[index] === color[0]
  && data[index + 1] === color[1]
  && data[index + 2] === color[2]
  && data[index + 3] === color[3]
)

const toHex = (value: number) => value.toString(16).padStart(2, '0')

export function useCanvasDraw({ canvasRef, activeTool, color, pixelSize, onColorChange }: UseCanvasDrawOptions): CanvasPointerHandlers {
  const isDrawingRef = useRef(false)
  const lastBlockRef = useRef<string | undefined>(undefined)

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>): CanvasPoint | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const bounds = canvas.getBoundingClientRect()
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor((event.clientX - bounds.left) * canvas.width / bounds.width)))
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((event.clientY - bounds.top) * canvas.height / bounds.height)))

    return {
      x,
      y,
      blockX: Math.floor(x / pixelSize) * pixelSize,
      blockY: Math.floor(y / pixelSize) * pixelSize,
    }
  }

  const drawBlock = (point: CanvasPoint, erase = false) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const blockWidth = Math.min(pixelSize, canvas.width - point.blockX)
    const blockHeight = Math.min(pixelSize, canvas.height - point.blockY)

    if (erase) {
      context.clearRect(point.blockX, point.blockY, blockWidth, blockHeight)
    } else {
      context.fillStyle = color
      context.fillRect(point.blockX, point.blockY, blockWidth, blockHeight)
    }
  }

  const pickColor = (point: CanvasPoint) => {
    const context = canvasRef.current?.getContext('2d')
    if (!context) return

    const pixel = context.getImageData(point.x, point.y, 1, 1).data
    if (pixel[3] === 0) return
    onColorChange(`#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`)
  }

  const fillConnectedBlocks = (point: CanvasPoint) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !context) return

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const targetIndex = (point.blockY * canvas.width + point.blockX) * 4
    const targetColor = Array.from(imageData.data.slice(targetIndex, targetIndex + 4))

    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const replacementColor = Array.from(context.getImageData(0, 0, 1, 1).data)
    context.putImageData(imageData, 0, 0)

    if (targetColor.every((channel, index) => channel === replacementColor[index])) return

    const columns = Math.ceil(canvas.width / pixelSize)
    const rows = Math.ceil(canvas.height / pixelSize)
    const startColumn = Math.floor(point.blockX / pixelSize)
    const startRow = Math.floor(point.blockY / pixelSize)
    const queue: Array<[number, number]> = [[startColumn, startRow]]
    const visited = new Uint8Array(columns * rows)

    while (queue.length > 0) {
      const [column, row] = queue.pop()!
      if (column < 0 || column >= columns || row < 0 || row >= rows) continue

      const visitedIndex = row * columns + column
      if (visited[visitedIndex]) continue
      visited[visitedIndex] = 1

      const blockX = column * pixelSize
      const blockY = row * pixelSize
      const pixelIndex = (blockY * canvas.width + blockX) * 4
      if (!rgbaMatches(imageData.data, pixelIndex, targetColor)) continue

      context.fillStyle = color
      context.fillRect(
        blockX,
        blockY,
        Math.min(pixelSize, canvas.width - blockX),
        Math.min(pixelSize, canvas.height - blockY),
      )

      queue.push([column - 1, row], [column + 1, row], [column, row - 1], [column, row + 1])
    }
  }

  const applyTool = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event)
    if (!point) return

    const blockKey = `${point.blockX}:${point.blockY}`
    if ((activeTool === 'pencil' || activeTool === 'eraser') && lastBlockRef.current === blockKey) return
    lastBlockRef.current = blockKey

    if (activeTool === 'pencil') drawBlock(point)
    if (activeTool === 'eraser') drawBlock(point, true)
    if (activeTool === 'fill') fillConnectedBlocks(point)
    if (activeTool === 'eyedropper') pickColor(point)
  }

  const finishDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false
    lastBlockRef.current = undefined
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return {
    onPointerDown: (event) => {
      if (activeTool === 'select') return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      isDrawingRef.current = true
      applyTool(event)
    },
    onPointerMove: (event) => {
      if (!isDrawingRef.current || (activeTool !== 'pencil' && activeTool !== 'eraser')) return
      applyTool(event)
    },
    onPointerUp: finishDrawing,
    onPointerCancel: finishDrawing,
  }
}
