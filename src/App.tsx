import { useCallback, useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PixelCanvas from './components/Canvas/PixelCanvas'
import ControlPanel from './components/ControlPanel'
import type { EditorTool } from './types/editor'
import { downloadCanvasAsPng } from './utils/exportHelpers'
import { captureCanvasSnapshot, restoreCanvasSnapshot } from './utils/canvasHelpers'
import { useEditorStore } from './store/useEditorStore'

function App() {
  const [activeTool, setActiveTool] = useState<EditorTool>('pencil')
  const [canvasWidth, setCanvasWidth] = useState(256)
  const [canvasHeight, setCanvasHeight] = useState(256)
  const [showGrid, setShowGrid] = useState(true)
  const [pixelSize, setPixelSize] = useState(8)
  const [zoom, setZoom] = useState(200)
  const [color, setColor] = useState('#52525b')
  const [sourceImage, setSourceImage] = useState<ImageBitmap | null>(null)
  const [imageName, setImageName] = useState<string>()
  const [paletteSize, setPaletteSize] = useState(3)
  const [cleanNoise, setCleanNoise] = useState(true)
  const [hasManualEdits, setHasManualEdits] = useState(false)
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)
  const record = useEditorStore((state) => state.record)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const clearHistory = useEditorStore((state) => state.clearHistory)

  // sourceImage 變更或元件卸載時，釋放 ImageBitmap 資源，避免記憶體洩漏
  useEffect(() => () => sourceImage?.close(), [sourceImage])
  useEffect(() => clearHistory(), [sourceImage, clearHistory])

  const handleImageSelect = async (file: File) => {
    const image = await createImageBitmap(file)
    const fitScale = Math.min(1, 256 / image.width, 256 / image.height)
    const fittedWidth = Math.max(4, Math.min(256, Math.round((image.width * fitScale) / 4) * 4))
    const fittedHeight = Math.max(4, Math.min(256, Math.round((image.height * fitScale) / 4) * 4))

    setSourceImage(image)
    setHasManualEdits(false)
    setImageName(file.name)
    setCanvasWidth(fittedWidth)
    setCanvasHeight(fittedHeight)
  }

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    outputCanvasRef.current = canvas
  }, [])

  const handleEditStart = useCallback((canvas: HTMLCanvasElement) => {
    const snapshot = captureCanvasSnapshot(canvas)
    if (snapshot) record(snapshot)
    setHasManualEdits(true)
  }, [record])

  const handleCanvasSizeChange = useCallback((width: number, height: number) => {
    if (width === canvasWidth && height === canvasHeight) return

    const canvas = outputCanvasRef.current
    if (canvas) {
      const snapshot = captureCanvasSnapshot(canvas)
      if (snapshot) record(snapshot)
    }

    setCanvasWidth(width)
    setCanvasHeight(height)
  }, [canvasWidth, canvasHeight, record])

  const handleUndo = useCallback(() => {
    const canvas = outputCanvasRef.current
    if (!canvas) return
    const current = captureCanvasSnapshot(canvas)
    if (!current) return
    const previous = undo(current)
    if (previous && restoreCanvasSnapshot(canvas, previous)) {
      setCanvasWidth(previous.width)
      setCanvasHeight(previous.height)
    }
  }, [undo])

  const handleRedo = useCallback(() => {
    const canvas = outputCanvasRef.current
    if (!canvas) return
    const current = captureCanvasSnapshot(canvas)
    if (!current) return
    const next = redo(current)
    if (next && restoreCanvasSnapshot(canvas, next)) {
      setCanvasWidth(next.width)
      setCanvasHeight(next.height)
    }
  }, [redo])

  const handleClearCanvas = useCallback(() => {
    const canvas = outputCanvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const snapshot = captureCanvasSnapshot(canvas)
    if (snapshot) record(snapshot)
    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasManualEdits(true)
  }, [record])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) handleRedo()
        else handleUndo()
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const handleExport = () => {
    const canvas = outputCanvasRef.current
    if (!canvas || (!sourceImage && !hasManualEdits)) return

    const baseName = imageName?.replace(/\.[^.]+$/, '') || 'pixel-art'
    void downloadCanvasAsPng(canvas, `${baseName}-pixel-art.png`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        imageName={imageName}
        onImageSelect={handleImageSelect}
        onExport={handleExport}
        canExport={Boolean(sourceImage || hasManualEdits)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <main className="mx-auto grid w-full flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5 xl:p-5">
        <Toolbar
          activeTool={activeTool}
          color={color}
          onColorChange={setColor}
          onToolChange={setActiveTool}
          onClear={handleClearCanvas}
        />

        <PixelCanvas
          width={canvasWidth}
          height={canvasHeight}
          pixelSize={pixelSize}
          showGrid={showGrid}
          zoom={zoom}
          sourceImage={sourceImage}
          paletteSize={paletteSize}
          cleanNoise={cleanNoise}
          hasManualEdits={hasManualEdits}
          onCanvasReady={handleCanvasReady}
          activeTool={activeTool}
          color={color}
          onColorChange={setColor}
          onEditStart={handleEditStart}
          onImageSelect={handleImageSelect}
        />

        <ControlPanel
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          pixelSize={pixelSize}
          showGrid={showGrid}
          zoom={zoom}
          paletteSize={paletteSize}
          cleanNoise={cleanNoise}
          onCanvasWidthChange={(value) => handleCanvasSizeChange(value, canvasHeight)}
          onCanvasHeightChange={(value) => handleCanvasSizeChange(canvasWidth, value)}
          onCanvasSizeChange={handleCanvasSizeChange}
          onGridChange={setShowGrid}
          onPixelSizeChange={setPixelSize}
          onZoomChange={setZoom}
          onPaletteSizeChange={setPaletteSize}
          onCleanNoiseChange={setCleanNoise}
        />
      </main>

    </div>
  )
}

export default App
