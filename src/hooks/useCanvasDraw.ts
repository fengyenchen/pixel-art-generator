import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CanvasPointerHandlers, CanvasSelection, UseCanvasDrawOptions } from '../types/canvasDraw'

interface CanvasPoint {
  x: number
  y: number
  blockX: number
  blockY: number
  column: number
  row: number
}

const rgbaMatches = (data: Uint8ClampedArray, index: number, color: number[]) => (
  data[index] === color[0]
  && data[index + 1] === color[1]
  && data[index + 2] === color[2]
  && data[index + 3] === color[3]
)

const toHex = (value: number) => value.toString(16).padStart(2, '0')

export function useCanvasDraw({ canvasRef, activeTool, color, pixelSize, onColorChange, onEditStart, shapeSettings, selection, onSelectionChange }: UseCanvasDrawOptions): CanvasPointerHandlers {
  const isDrawingRef = useRef(false)
  const lastBlockRef = useRef<string | undefined>(undefined)
  const shapeStartRef = useRef<CanvasPoint | null>(null)
  const shapeSnapshotRef = useRef<ImageData | null>(null)
  const marqueeStartRef = useRef<CanvasPoint | null>(null)
  const moveStartRef = useRef<CanvasPoint | null>(null)
  const moveOriginRef = useRef<CanvasSelection | null>(null)
  const moveCanvasSnapshotRef = useRef<ImageData | null>(null)
  const movePixelsRef = useRef<ImageData | null>(null)
  const hasRecordedMoveRef = useRef(false)

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
      column: Math.floor(x / pixelSize),
      row: Math.floor(y / pixelSize),
    }
  }

  const constrainShapePoint = (start: CanvasPoint, end: CanvasPoint, constrain: boolean) => {
    const canvas = canvasRef.current
    if (!canvas || !constrain) return end

    const columns = Math.ceil(canvas.width / pixelSize)
    const rows = Math.ceil(canvas.height / pixelSize)

    if (shapeSettings.kind === 'line') {
      const deltaColumn = end.column - start.column
      const deltaRow = end.row - start.row
      if (deltaColumn === 0 && deltaRow === 0) return end

      const snappedAngle = Math.round(Math.atan2(deltaRow, deltaColumn) / (Math.PI / 4)) * (Math.PI / 4)
      const columnDirection = Math.round(Math.cos(snappedAngle))
      const rowDirection = Math.round(Math.sin(snappedAngle))
      const requestedSize = columnDirection === 0
        ? Math.abs(deltaRow)
        : rowDirection === 0
          ? Math.abs(deltaColumn)
          : Math.max(Math.abs(deltaColumn), Math.abs(deltaRow))
      const availableColumns = columnDirection > 0
        ? columns - 1 - start.column
        : columnDirection < 0 ? start.column : Number.POSITIVE_INFINITY
      const availableRows = rowDirection > 0
        ? rows - 1 - start.row
        : rowDirection < 0 ? start.row : Number.POSITIVE_INFINITY
      const size = Math.min(requestedSize, availableColumns, availableRows)
      const column = start.column + columnDirection * size
      const row = start.row + rowDirection * size

      return {
        x: column * pixelSize,
        y: row * pixelSize,
        blockX: column * pixelSize,
        blockY: row * pixelSize,
        column,
        row,
      }
    }

    const columnDirection = end.column >= start.column ? 1 : -1
    const rowDirection = end.row >= start.row ? 1 : -1
    const requestedSize = Math.max(Math.abs(end.column - start.column), Math.abs(end.row - start.row))
    const availableColumns = columnDirection > 0 ? columns - 1 - start.column : start.column
    const availableRows = rowDirection > 0 ? rows - 1 - start.row : start.row
    const size = Math.min(requestedSize, availableColumns, availableRows)
    const column = start.column + columnDirection * size
    const row = start.row + rowDirection * size

    return {
      x: column * pixelSize,
      y: row * pixelSize,
      blockX: column * pixelSize,
      blockY: row * pixelSize,
      column,
      row,
    }
  }

  const selectionFromPoints = (start: CanvasPoint, end: CanvasPoint): CanvasSelection => {
    const canvas = canvasRef.current
    const x = Math.min(start.blockX, end.blockX)
    const y = Math.min(start.blockY, end.blockY)
    const right = Math.max(start.blockX, end.blockX) + pixelSize
    const bottom = Math.max(start.blockY, end.blockY) + pixelSize

    return {
      x,
      y,
      width: Math.max(1, Math.min(canvas?.width ?? right, right) - x),
      height: Math.max(1, Math.min(canvas?.height ?? bottom, bottom) - y),
    }
  }

  const pointIsInSelection = (point: CanvasPoint, current: CanvasSelection) => (
    point.x >= current.x
    && point.x < current.x + current.width
    && point.y >= current.y
    && point.y < current.y + current.height
  )

  const previewSelectionMove = (point: CanvasPoint) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const start = moveStartRef.current
    const origin = moveOriginRef.current
    const snapshot = moveCanvasSnapshotRef.current
    const pixels = movePixelsRef.current
    if (!canvas || !context || !start || !origin || !snapshot || !pixels) return

    const requestedX = origin.x + (point.column - start.column) * pixelSize
    const requestedY = origin.y + (point.row - start.row) * pixelSize
    const x = Math.min(canvas.width - origin.width, Math.max(0, requestedX))
    const y = Math.min(canvas.height - origin.height, Math.max(0, requestedY))

    if (!hasRecordedMoveRef.current && (x !== origin.x || y !== origin.y)) {
      onEditStart(canvas)
      hasRecordedMoveRef.current = true
    }

    context.putImageData(snapshot, 0, 0)
    context.clearRect(origin.x, origin.y, origin.width, origin.height)
    context.putImageData(pixels, x, y)
    onSelectionChange({ ...origin, x, y })
  }

  const paintCell = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, column: number, row: number) => {
    const blockX = column * pixelSize
    const blockY = row * pixelSize
    if (blockX < 0 || blockY < 0 || blockX >= canvas.width || blockY >= canvas.height) return
    context.fillRect(blockX, blockY, Math.min(pixelSize, canvas.width - blockX), Math.min(pixelSize, canvas.height - blockY))
  }

  const drawLine = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, start: CanvasPoint, end: CanvasPoint) => {
    let x = start.column
    let y = start.row
    const dx = Math.abs(end.column - x)
    const dy = Math.abs(end.row - y)
    const stepX = x < end.column ? 1 : -1
    const stepY = y < end.row ? 1 : -1
    let error = dx - dy
    const radiusBefore = Math.floor((shapeSettings.strokeWidth - 1) / 2)
    const radiusAfter = Math.ceil((shapeSettings.strokeWidth - 1) / 2)

    while (true) {
      for (let offsetY = -radiusBefore; offsetY <= radiusAfter; offsetY += 1) {
        for (let offsetX = -radiusBefore; offsetX <= radiusAfter; offsetX += 1) {
          paintCell(context, canvas, x + offsetX, y + offsetY)
        }
      }
      if (x === end.column && y === end.row) break
      const doubledError = error * 2
      if (doubledError > -dy) { error -= dy; x += stepX }
      if (doubledError < dx) { error += dx; y += stepY }
    }
  }

  const drawShape = (start: CanvasPoint, end: CanvasPoint) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.fillStyle = color
    if (shapeSettings.kind === 'line') {
      drawLine(context, canvas, start, end)
      return
    }

    const left = Math.min(start.column, end.column)
    const right = Math.max(start.column, end.column)
    const top = Math.min(start.row, end.row)
    const bottom = Math.max(start.row, end.row)
    const width = right - left + 1
    const height = bottom - top + 1

    for (let row = top; row <= bottom; row += 1) {
      for (let column = left; column <= right; column += 1) {
        let shouldPaint: boolean

        if (shapeSettings.kind === 'rectangle') {
          shouldPaint = shapeSettings.style === 'fill'
            || column - left < shapeSettings.strokeWidth
            || right - column < shapeSettings.strokeWidth
            || row - top < shapeSettings.strokeWidth
            || bottom - row < shapeSettings.strokeWidth
        } else {
          const normalizedX = (column - left + 0.5 - width / 2) / (width / 2)
          const normalizedY = (row - top + 0.5 - height / 2) / (height / 2)
          const insideOuterEllipse = normalizedX ** 2 + normalizedY ** 2 <= 1

          if (shapeSettings.style === 'fill') {
            shouldPaint = insideOuterEllipse
          } else {
            const innerWidth = width - shapeSettings.strokeWidth * 2
            const innerHeight = height - shapeSettings.strokeWidth * 2
            const insideInnerEllipse = innerWidth > 0 && innerHeight > 0
              && ((column - left + 0.5 - width / 2) / (innerWidth / 2)) ** 2
                + ((row - top + 0.5 - height / 2) / (innerHeight / 2)) ** 2 <= 1
            shouldPaint = insideOuterEllipse && !insideInnerEllipse
          }
        }

        if (shouldPaint) paintCell(context, canvas, column, row)
      }
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
    if (activeTool === 'marquee' && isDrawingRef.current) {
      const point = getCanvasPoint(event)
      const start = marqueeStartRef.current
      if (point && start) onSelectionChange(selectionFromPoints(start, point))
    }
    if (activeTool === 'move' && isDrawingRef.current) {
      const point = getCanvasPoint(event)
      if (point) previewSelectionMove(point)
    }
    if (activeTool === 'shape' && isDrawingRef.current) {
      const point = getCanvasPoint(event)
      const start = shapeStartRef.current
      const snapshot = shapeSnapshotRef.current
      const context = event.currentTarget.getContext('2d')
      if (point && start && snapshot && context) {
        context.putImageData(snapshot, 0, 0)
        drawShape(start, constrainShapePoint(start, point, event.shiftKey))
      }
    }
    isDrawingRef.current = false
    lastBlockRef.current = undefined
    shapeStartRef.current = null
    shapeSnapshotRef.current = null
    marqueeStartRef.current = null
    moveStartRef.current = null
    moveOriginRef.current = null
    moveCanvasSnapshotRef.current = null
    movePixelsRef.current = null
    hasRecordedMoveRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return {
    onPointerDown: (event) => {
      if (activeTool === 'select') return
      if (activeTool === 'marquee') {
        const point = getCanvasPoint(event)
        if (!point) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        isDrawingRef.current = true
        marqueeStartRef.current = point
        onSelectionChange(selectionFromPoints(point, point))
        return
      }

      if (activeTool === 'move') {
        const point = getCanvasPoint(event)
        const context = event.currentTarget.getContext('2d')
        if (!point || !selection || !context || !pointIsInSelection(point, selection)) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        isDrawingRef.current = true
        moveStartRef.current = point
        moveOriginRef.current = selection
        moveCanvasSnapshotRef.current = context.getImageData(0, 0, event.currentTarget.width, event.currentTarget.height)
        movePixelsRef.current = context.getImageData(selection.x, selection.y, selection.width, selection.height)
        hasRecordedMoveRef.current = false
        return
      }

      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      isDrawingRef.current = true
      if (activeTool !== 'eyedropper') onEditStart(event.currentTarget)
      if (activeTool === 'shape') {
        const point = getCanvasPoint(event)
        const context = event.currentTarget.getContext('2d')
        if (point && context) {
          shapeStartRef.current = point
          shapeSnapshotRef.current = context.getImageData(0, 0, event.currentTarget.width, event.currentTarget.height)
          drawShape(point, point)
        }
        return
      }
      applyTool(event)
    },
    onPointerMove: (event) => {
      if (!isDrawingRef.current) return
      event.preventDefault()
      if (activeTool === 'marquee') {
        const point = getCanvasPoint(event)
        const start = marqueeStartRef.current
        if (point && start) onSelectionChange(selectionFromPoints(start, point))
        return
      }
      if (activeTool === 'move') {
        const point = getCanvasPoint(event)
        if (point) previewSelectionMove(point)
        return
      }
      if (activeTool === 'shape') {
        const point = getCanvasPoint(event)
        const start = shapeStartRef.current
        const snapshot = shapeSnapshotRef.current
        const context = event.currentTarget.getContext('2d')
        if (point && start && snapshot && context) {
          context.putImageData(snapshot, 0, 0)
          drawShape(start, constrainShapePoint(start, point, event.shiftKey))
        }
        return
      }
      if (activeTool !== 'pencil' && activeTool !== 'eraser') return
      applyTool(event)
    },
    onPointerUp: finishDrawing,
    onPointerCancel: finishDrawing,
  }
}
