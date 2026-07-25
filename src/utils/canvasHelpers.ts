import type { CanvasSnapshot } from '../types/history'

export function captureCanvasSnapshot(canvas: HTMLCanvasElement): CanvasSnapshot | null {
  const context = canvas.getContext('2d')
  if (!context) return null

  return {
    width: canvas.width,
    height: canvas.height,
    imageData: context.getImageData(0, 0, canvas.width, canvas.height),
  }
}

export function restoreCanvasSnapshot(canvas: HTMLCanvasElement, snapshot: CanvasSnapshot) {
  if (canvas.width !== snapshot.width || canvas.height !== snapshot.height) return false

  const context = canvas.getContext('2d')
  if (!context) return false

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.putImageData(snapshot.imageData, 0, 0)
  return true
}
