import { useState } from 'react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PixelCanvas from './components/Canvas/PixelCanvas'
import ControlPanel from './components/ControlPanel'
import type { EditorTool } from './types/editor'

function App() {
  const [activeTool, setActiveTool] = useState<EditorTool>('pencil')
  const [canvasWidth, setCanvasWidth] = useState(32)
  const [canvasHeight, setCanvasHeight] = useState(32)
  const [showGrid, setShowGrid] = useState(true)
  const [pixelSize, setPixelSize] = useState(16)
  const [zoom, setZoom] = useState(100)
  const [color, setColor] = useState('#52525b')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full flex-1 gap-4 p-4 overflow-hidden lg:gap-5 lg:p-5">
        <Toolbar
          activeTool={activeTool}
          color={color}
          onColorChange={setColor}
          onToolChange={setActiveTool}
        />

        <PixelCanvas width={canvasWidth} height={canvasHeight} showGrid={showGrid} zoom={zoom} />

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
