'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Props = {
  file: File
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

export function AvatarCropModal({ file, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Crop state: offset is the image's top-left relative to the canvas centre
  const [scale, setScale] = useState(1)
  const [minScale, setMinScale] = useState(0.01) // cover scale — set once image loads
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  const CANVAS_SIZE = 320 // px — square canvas, circle inscribed
  const MAX_SCALE = 4

  // Load image
  useEffect(() => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      imgRef.current = img
      // Cover scale: smallest scale at which the image fills the circle.
      // This becomes the slider minimum — can't zoom out past the point where
      // the circle would have empty corners.
      const cover = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight)
      setMinScale(cover)
      setScale(cover)
      setOffset({ x: 0, y: 0 })
      setImgLoaded(true)
      URL.revokeObjectURL(url)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Dark overlay background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw image centred + offset
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = CANVAS_SIZE / 2 - w / 2 + offset.x
    const y = CANVAS_SIZE / 2 - h / 2 + offset.y
    ctx.drawImage(img, x, y, w, h)

    // Dim outside the circle
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    // Cut out the circle (destination-out reveals the image below)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Circle border
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }, [imgLoaded, scale, offset])

  useEffect(() => { draw() }, [draw])

  // Drag handlers
  function onPointerDown(e: React.PointerEvent) {
    drag.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.startX),
      y: drag.current.oy + (e.clientY - drag.current.startY),
    })
  }
  function onPointerUp() { drag.current = null }

  // Scroll to zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setScale((s) => Math.min(MAX_SCALE, Math.max(minScale, s - e.deltaY * 0.002)))
  }

  // Confirm — render cropped circle to a new canvas and export as lossless PNG.
  // compressImage() in the caller does the single JPEG encode pass, targeting
  // max quality within the upload size limit.
  async function handleConfirm() {
    const img = imgRef.current
    if (!img) return

    const OUTPUT_SIZE = 800
    const out = document.createElement('canvas')
    out.width = OUTPUT_SIZE
    out.height = OUTPUT_SIZE
    const ctx = out.getContext('2d')
    if (!ctx) return

    const ratio = OUTPUT_SIZE / CANVAS_SIZE
    const w = img.naturalWidth * scale * ratio
    const h = img.naturalHeight * scale * ratio
    const x = OUTPUT_SIZE / 2 - w / 2 + offset.x * ratio
    const y = OUTPUT_SIZE / 2 - h / 2 + offset.y * ratio

    // Clip to circle
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, x, y, w, h)

    out.toBlob((blob) => {
      if (!blob) return
      const baseName = file.name.replace(/\.[^.]+$/, '')
      onConfirm(new File([blob], `${baseName}-avatar.png`, { type: 'image/png', lastModified: Date.now() }))
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#0d0d1a] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-black text-lg mb-1 text-center">Crop your photo</h3>
        <p className="text-white/40 text-xs text-center mb-5">Drag to reposition · scroll to zoom</p>

        <div className="flex justify-center mb-5">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-full cursor-grab active:cursor-grabbing touch-none"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
          />
        </div>

        {/* Zoom slider */}
        <div className="mb-5 px-2">
          <input
            type="range"
            min={minScale}
            max={MAX_SCALE}
            step={0.001}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full accent-jungle-400"
          />
          <div className="flex justify-between text-white/30 text-xs mt-1">
            <span>zoom out</span>
            <span>zoom in</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!imgLoaded}
            className="flex-1 bg-jungle-500 hover:bg-jungle-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            Use this crop
          </button>
        </div>
      </div>
    </div>
  )
}
