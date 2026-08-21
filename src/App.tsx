import { useCallback, useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PixelCanvas from './components/Canvas/PixelCanvas'
import ControlPanel from './components/ControlPanel'
import HelpModal from './components/HelpModal'
import CropEditor from './components/CropEditor'
import type { EditorTool, ShapeKind, ShapeStyle } from './types/editor'
import { downloadCanvasAsPng } from './utils/exportHelpers'
import { captureCanvasSnapshot, restoreCanvasSnapshot } from './utils/canvasHelpers'
import { useEditorStore } from './store/useEditorStore'
import { downloadProject, projectPixelsToImage, readProject } from './utils/projectHelpers'
import { cropImageBitmap, downloadCroppedImage } from './utils/cropImage'
import type { CropRect } from './types/crop'
import type { CanvasSelection } from './types/canvasDraw'

interface CropSession {
  image: ImageBitmap
  name: string
  isNewImage: boolean
}

function App() {
  const [activeTool, setActiveTool] = useState<EditorTool>('pencil')
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rectangle')
  const [shapeStyle, setShapeStyle] = useState<ShapeStyle>('fill')
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(1)
  const [selection, setSelection] = useState<CanvasSelection | null>(null)
  const [canvasWidth, setCanvasWidth] = useState(256)
  const [canvasHeight, setCanvasHeight] = useState(256)
  const [showGrid, setShowGrid] = useState(true)
  const [pixelSize, setPixelSize] = useState(8)
  const [zoom, setZoom] = useState(200)
  const [color, setColor] = useState('#52525b')
  const [sourceImage, setSourceImage] = useState<ImageBitmap | null>(null)
  const [originalImage, setOriginalImage] = useState<ImageBitmap | null>(null)
  const [cropSession, setCropSession] = useState<CropSession | null>(null)
  const [imageName, setImageName] = useState<string>()
  const [paletteSize, setPaletteSize] = useState(3)
  const [cleanNoise, setCleanNoise] = useState(true)
  const [hasManualEdits, setHasManualEdits] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [pendingProjectImage, setPendingProjectImage] = useState<ImageBitmap | null>(null)
  const [projectError, setProjectError] = useState<string>()
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const canUndo = useEditorStore((state) => state.past.length > 0)
  const canRedo = useEditorStore((state) => state.future.length > 0)
  const record = useEditorStore((state) => state.record)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const clearHistory = useEditorStore((state) => state.clearHistory)

  // sourceImage 變更或元件卸載時，釋放 ImageBitmap 資源，避免記憶體洩漏
  useEffect(() => () => sourceImage?.close(), [sourceImage])
  useEffect(() => () => originalImage?.close(), [originalImage])
  useEffect(() => clearHistory(), [sourceImage, clearHistory])

  useEffect(() => {
    const canvas = outputCanvasRef.current
    if (!canvas || !pendingProjectImage || canvas.width !== canvasWidth || canvas.height !== canvasHeight) return

    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(pendingProjectImage, 0, 0)
    pendingProjectImage.close()
    setPendingProjectImage(null)
    clearHistory()
  }, [pendingProjectImage, canvasWidth, canvasHeight, clearHistory])

  const handleImageSelect = async (file: File) => {
    const image = await createImageBitmap(file)
    if (cropSession?.isNewImage) cropSession.image.close()
    setCropSession({ image, name: file.name, isNewImage: true })
  }

  const fitCanvasToImage = (image: ImageBitmap) => {
    const fitScale = Math.min(1, 256 / image.width, 256 / image.height)
    return {
      width: Math.max(4, Math.min(256, Math.round((image.width * fitScale) / 4) * 4)),
      height: Math.max(4, Math.min(256, Math.round((image.height * fitScale) / 4) * 4)),
    }
  }

  const handleApplyCrop = async (crop: CropRect) => {
    if (!cropSession) return
    const croppedImage = await cropImageBitmap(cropSession.image, crop)
    const size = fitCanvasToImage(croppedImage)

    if (cropSession.isNewImage) setOriginalImage(cropSession.image)
    setSourceImage(croppedImage)
    setSelection(null)
    setHasManualEdits(false)
    setImageName(cropSession.name)
    setCanvasWidth(size.width)
    setCanvasHeight(size.height)
    setCropSession(null)
  }

  const handleDownloadCrop = async (crop: CropRect) => {
    if (!cropSession) return
    const baseName = cropSession.name.replace(/\.[^.]+$/, '') || 'cropped-image'
    await downloadCroppedImage(cropSession.image, crop, `${baseName}-cropped.png`)
    if (cropSession.isNewImage) cropSession.image.close()
    setCropSession(null)
  }

  const handleCancelCrop = () => {
    if (cropSession?.isNewImage) cropSession.image.close()
    setCropSession(null)
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
    setSelection(null)
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
      setSelection(null)
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
      setSelection(null)
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
    setSelection(null)
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

  const handleSaveProject = () => {
    const canvas = outputCanvasRef.current
    if (!canvas) return

    const baseName = imageName?.replace(/\.[^.]+$/, '').replace(/\.pixel-art$/, '') || 'untitled'
    downloadProject(canvas, {
      pixelSize,
      paletteSize,
      zoom,
      showGrid,
      cleanNoise,
      color,
    }, `${baseName}.pixel-art.json`)
  }

  const handleLoadProject = async (file: File) => {
    try {
      const project = await readProject(file)
      const image = await projectPixelsToImage(project.canvas.pixelData)

      setProjectError(undefined)
      setSourceImage(null)
      setOriginalImage(null)
      setSelection(null)
      setHasManualEdits(true)
      setPendingProjectImage(image)
      setImageName(file.name)
      setCanvasWidth(project.canvas.width)
      setCanvasHeight(project.canvas.height)
      setPixelSize(project.settings.pixelSize)
      setPaletteSize(project.settings.paletteSize)
      setZoom(project.settings.zoom)
      setShowGrid(project.settings.showGrid)
      setCleanNoise(project.settings.cleanNoise)
      setColor(project.settings.color)
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : '無法載入專案檔案')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        imageName={imageName}
        onImageSelect={handleImageSelect}
        onOpenCrop={() => originalImage && setCropSession({ image: originalImage, name: imageName ?? 'image', isNewImage: false })}
        canCrop={Boolean(originalImage)}
        onExport={handleExport}
        canExport={Boolean(sourceImage || hasManualEdits)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
      />

      <main className="mx-auto grid w-full flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5 xl:p-5">
        <Toolbar
          activeTool={activeTool}
          color={color}
          onColorChange={setColor}
          onToolChange={(tool) => {
            setActiveTool(tool)
            if (tool !== 'marquee' && tool !== 'move') setSelection(null)
          }}
          onClear={handleClearCanvas}
          shapeKind={shapeKind}
          shapeStyle={shapeStyle}
          shapeStrokeWidth={shapeStrokeWidth}
          onShapeKindChange={setShapeKind}
          onShapeStyleChange={setShapeStyle}
          onShapeStrokeWidthChange={setShapeStrokeWidth}
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
          onProjectLoad={handleLoadProject}
          shapeSettings={{ kind: shapeKind, style: shapeStyle, strokeWidth: shapeStrokeWidth }}
          selection={selection}
          onSelectionChange={setSelection}
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

      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}

      {cropSession && (
        <CropEditor
          image={cropSession.image}
          imageName={cropSession.name}
          onCancel={handleCancelCrop}
          onApply={handleApplyCrop}
          onDownload={handleDownloadCrop}
        />
      )}

      {projectError && (
        <button
          type="button"
          onClick={() => setProjectError(undefined)}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-secondary-foreground shadow-lg"
          title="點擊關閉"
        >
          {projectError}
        </button>
      )}

    </div>
  )
}

export default App
