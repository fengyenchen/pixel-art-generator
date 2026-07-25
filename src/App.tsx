import { useEffect, useState } from 'react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PixelCanvas from './components/Canvas/PixelCanvas'
import ControlPanel from './components/ControlPanel'
import type { EditorTool } from './types/editor'

function App() {
  const [activeTool, setActiveTool] = useState<EditorTool>('pencil')
  const [canvasWidth, setCanvasWidth] = useState(64)
  const [canvasHeight, setCanvasHeight] = useState(64)
  const [showGrid, setShowGrid] = useState(true)
  const [pixelSize, setPixelSize] = useState(8)
  const [zoom, setZoom] = useState(800)
  const [color, setColor] = useState('#52525b')
  const [sourceImage, setSourceImage] = useState<ImageBitmap | null>(null)
  const [imageName, setImageName] = useState<string>()

  // sourceImage 變更或元件卸載時，釋放 ImageBitmap 資源，避免記憶體洩漏
  useEffect(() => () => sourceImage?.close(), [sourceImage])

  const handleImageSelect = async (file: File) => {
    const image = await createImageBitmap(file)
    const fitScale = Math.min(1, 256 / image.width, 256 / image.height)
    const fittedWidth = Math.max(4, Math.min(256, Math.round((image.width * fitScale) / 4) * 4))
    const fittedHeight = Math.max(4, Math.min(256, Math.round((image.height * fitScale) / 4) * 4))

    setSourceImage(image)
    setImageName(file.name)
    setCanvasWidth(fittedWidth)
    setCanvasHeight(fittedHeight)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header imageName={imageName} onImageSelect={handleImageSelect} />

      <main className="mx-auto grid w-full flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5 xl:p-5">
        <Toolbar
          activeTool={activeTool}
          color={color}
          onColorChange={setColor}
          onToolChange={setActiveTool}
        />

        <PixelCanvas
          width={canvasWidth}
          height={canvasHeight}
          pixelSize={pixelSize}
          showGrid={showGrid}
          zoom={zoom}
          sourceImage={sourceImage}
        />

        <ControlPanel
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          pixelSize={pixelSize}
          showGrid={showGrid}
          zoom={zoom}
          onCanvasWidthChange={setCanvasWidth}
          onCanvasHeightChange={setCanvasHeight}
          onGridChange={setShowGrid}
          onPixelSizeChange={setPixelSize}
          onZoomChange={setZoom}
        />
      </main>
    </div>
  )
}

export default App
