export interface CanvasSnapshot {
  width: number
  height: number
  imageData: ImageData
}

export interface EditorHistoryState {
  past: CanvasSnapshot[]
  future: CanvasSnapshot[]
  record: (snapshot: CanvasSnapshot) => void
  undo: (current: CanvasSnapshot) => CanvasSnapshot | null
  redo: (current: CanvasSnapshot) => CanvasSnapshot | null
  clearHistory: () => void
}
