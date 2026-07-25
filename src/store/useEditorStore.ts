import { create } from 'zustand'
import type { EditorHistoryState } from '../types/history'

const HISTORY_LIMIT = 50

export const useEditorStore = create<EditorHistoryState>((set, get) => ({
  past: [],
  future: [],

  record: (snapshot) => {
    set((state) => ({
      past: [...state.past, snapshot].slice(-HISTORY_LIMIT),
      future: [],
    }))
  },

  undo: (current) => {
    const { past, future } = get()
    const previous = past.at(-1)
    if (!previous) return null

    set({
      past: past.slice(0, -1),
      future: [current, ...future].slice(0, HISTORY_LIMIT),
    })
    return previous
  },

  redo: (current) => {
    const { past, future } = get()
    const next = future[0]
    if (!next) return null

    set({
      past: [...past, current].slice(-HISTORY_LIMIT),
      future: future.slice(1),
    })
    return next
  },

  clearHistory: () => set({ past: [], future: [] }),
}))
