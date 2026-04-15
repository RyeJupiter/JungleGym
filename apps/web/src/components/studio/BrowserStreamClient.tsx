'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Props = {
  sessionId: string
  cfInputId: string
  cfStreamKey: string
  whipUrl: string
}

type ConnectionStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'disconnected' | 'error'

type DeviceInfo = {
  deviceId: string
  label: string
}

const PAUSE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export function BrowserStreamClient({ sessionId, cfInputId, cfStreamKey, whipUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pauseStartRef = useRef<number | null>(null)

  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioMuted, setAudioMuted] = useState(false)
  const [videoDisabled, setVideoDisabled] = useState(false)
  const [cameras, setCameras] = useState<DeviceInfo[]>([])
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [hasPermission, setHasPermission] = useState(false)
  const [pauseRemaining, setPauseRemaining] = useState<number | null>(null)

  // ── Device enumeration ────────────────────────────────────────
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}` }))
      const audioDevices = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}` }))
      setCameras(videoDevices)
      setMicrophones(audioDevices)
      if (videoDevices.length > 0 && !selectedCamera) setSelectedCamera(videoDevices[0].deviceId)
      if (audioDevices.length > 0 && !selectedMic) setSelectedMic(audioDevices[0].deviceId)
    } catch {
      // Silently fail
    }
  }, [selectedCamera, selectedMic])

  // ── Camera/mic preview ────────────────────────────────────────
  const startPreview = useCallback(async (cameraId?: string, micId?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, ...(cameraId ? { deviceId: { exact: cameraId } } : {}) },
        audio: { ...(micId ? { deviceId: { exact: micId } } : {}) },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setHasPermission(true)
      setError(null)
      await enumerateDevices()
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') setError('Camera/microphone permission denied. Please allow access in your browser settings.')
        else if (err.name === 'NotFoundError') setError('No camera or microphone found. Please connect a device and try again.')
        else setError(`Device error: ${err.message}`)
      } else {
        setError('Failed to access camera/microphone.')
      }
    }
  }, [enumerateDevices])

  useEffect(() => {
    startPreview()
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (pcRef.current) pcRef.current.close()
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pause countdown ticker ────────────────────────────────────
  useEffect(() => {
    if (status !== 'paused') {
      setPauseRemaining(null)
      return
    }
    const tick = setInterval(() => {
      if (pauseStartRef.current) {
        const elapsed = Date.now() - pauseStartRef.current
        const remaining = Math.max(0, PAUSE_TIMEOUT_MS - elapsed)
        setPauseRemaining(remaining)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [status])

  // ── Beforeunload: pause on tab close so server cleanup kicks in ─
  useEffect(() => {
    function handleBeforeUnload() {
      if (status === 'live' || status === 'connecting') {
        // Use sendBeacon for reliability — fetch may be cancelled during unload
        navigator.sendBeacon(
          '/api/stream/status',
          new Blob(
            [JSON.stringify({ sessionId, action: 'pause' })],
            { type: 'application/json' }
          )
        )
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionId, status])

  // ── Device switching ──────────────────────────────────────────
  async function handleDeviceChange(type: 'camera' | 'mic', deviceId: string) {
    if (type === 'camera') {
      setSelectedCamera(deviceId)
      if (status !== 'live') {
        await startPreview(deviceId, selectedMic)
      } else {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          })
          const newTrack = newStream.getVideoTracks()[0]
          if (pcRef.current && streamRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
            if (sender) await sender.replaceTrack(newTrack)
            const oldTrack = streamRef.current.getVideoTracks()[0]
            streamRef.current.removeTrack(oldTrack)
            oldTrack.stop()
            streamRef.current.addTrack(newTrack)
            if (videoRef.current) videoRef.current.srcObject = streamRef.current
          }
        } catch { setError('Failed to switch camera.') }
      }
    } else {
      setSelectedMic(deviceId)
      if (status !== 'live') {
        await startPreview(selectedCamera, deviceId)
      } else {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } })
          const newTrack = newStream.getAudioTracks()[0]
          if (pcRef.current && streamRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'audio')
            if (sender) await sender.replaceTrack(newTrack)
            const oldTrack = streamRef.current.getAudioTracks()[0]
            streamRef.current.removeTrack(oldTrack)
            oldTrack.stop()
            streamRef.current.addTrack(newTrack)
          }
        } catch { setError('Failed to switch microphone.') }
      }
    }
  }

  // ── Stream status API helper ──────────────────────────────────
  async function updateStreamStatus(action: 'pause' | 'resume' | 'end') {
    try {
      await fetch('/api/stream/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action }),
      })
    } catch {
      // Best effort — stream state is the source of truth
    }
  }

  // ── WHIP signaling (go live / resume) ─────────────────────────
  async function goLive() {
    if (!streamRef.current) {
      setError('No media stream available. Please allow camera/microphone access.')
      return
    }

    setStatus('connecting')
    setError(null)

    // Clear any pause timer
    if (pauseTimerRef.current) { clearTimeout(pauseTimerRef.current); pauseTimerRef.current = null }
    pauseStartRef.current = null

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
        bundlePolicy: 'max-bundle',
      })
      pcRef.current = pc

      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case 'connected': setStatus('live'); break
          case 'disconnected':
          case 'failed':
            // Auto-pause on unexpected disconnect (network drop, etc.)
            // This sets paused_at in DB so the server-side cleanup timer starts
            setStatus('disconnected')
            setError('Connection lost. Click "Go Live" to reconnect.')
            updateStreamStatus('pause')
            break
          case 'closed': break // Don't override status on intentional close
        }
      }

      streamRef.current.getTracks().forEach(track => {
        pc.addTransceiver(track, { direction: 'sendonly' })
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve()
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') resolve()
        }
      })

      const response = await fetch(
        `/api/stream/whip?sessionId=${encodeURIComponent(sessionId)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: pc.localDescription!.sdp }
      )

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`WHIP connection failed (${response.status})${text ? `: ${text}` : ''}`)
      }

      const answerSdp = await response.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (err) {
      setStatus('error')
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      setError(err instanceof Error ? err.message : 'Failed to start stream.')
    }
  }

  // ── Pause stream ──────────────────────────────────────────────
  function pauseStream() {
    // Disconnect from CF (stops billing)
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    setStatus('paused')
    setError(null)

    // Tell the DB we're paused (viewers see BRB)
    updateStreamStatus('pause')

    // Start 15-min auto-end timer
    pauseStartRef.current = Date.now()
    pauseTimerRef.current = setTimeout(() => {
      endStream()
    }, PAUSE_TIMEOUT_MS)
  }

  // ── Resume stream ─────────────────────────────────────────────
  async function resumeStream() {
    if (pauseTimerRef.current) { clearTimeout(pauseTimerRef.current); pauseTimerRef.current = null }
    pauseStartRef.current = null
    // Don't clear paused_at here — the WHIP proxy clears it when the
    // connection actually succeeds. This keeps the BRB overlay visible
    // for viewers during the reconnection window.
    await goLive()
  }

  // ── End stream ────────────────────────────────────────────────
  function endStream() {
    if (pauseTimerRef.current) { clearTimeout(pauseTimerRef.current); pauseTimerRef.current = null }
    pauseStartRef.current = null
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    setStatus('idle')
    setError(null)
    updateStreamStatus('end')
  }

  // ── Audio/video toggles ───────────────────────────────────────
  function toggleAudio() {
    if (streamRef.current) {
      const t = streamRef.current.getAudioTracks()[0]
      if (t) { t.enabled = !t.enabled; setAudioMuted(!t.enabled) }
    }
  }

  function toggleVideo() {
    if (streamRef.current) {
      const t = streamRef.current.getVideoTracks()[0]
      if (t) { t.enabled = !t.enabled; setVideoDisabled(!t.enabled) }
    }
  }

  const isLive = status === 'live'
  const isPaused = status === 'paused'
  const isConnecting = status === 'connecting'

  function formatRemaining(ms: number) {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="relative bg-stone-900 rounded-2xl overflow-hidden aspect-video">
        {/* BRB overlay when paused */}
        {isPaused && (
          <div className="absolute inset-0 z-20 bg-jungle-950 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl mb-4 animate-pulse">🌿</p>
              <p className="text-white text-xl font-black tracking-wide mb-2">Stream paused</p>
              <p className="text-white/50 text-sm">Viewers see a &ldquo;Be right back&rdquo; message</p>
              {pauseRemaining !== null && (
                <p className="text-amber-400 text-sm font-semibold mt-3">
                  Auto-ending in {formatRemaining(pauseRemaining)}
                </p>
              )}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!videoDisabled ? 'transform scale-x-[-1]' : ''}`}
          style={{ display: videoDisabled || isPaused ? 'none' : 'block' }}
        />
        {videoDisabled && !isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-stone-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                </svg>
              </div>
              <p className="text-stone-400 text-sm font-medium">Camera off</p>
            </div>
          </div>
        )}

        {/* Status badge */}
        {status !== 'idle' && !isPaused && (
          <div className="absolute top-3 left-3 z-10">
            {isLive && (
              <div className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
            {isConnecting && (
              <div className="flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Connecting...
              </div>
            )}
            {status === 'disconnected' && (
              <div className="flex items-center gap-2 bg-stone-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                Disconnected
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                Error
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          disabled={!hasPermission || isPaused}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            audioMuted
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {audioMuted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 19 17.591 17.591 5.409 5.409 4 4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 1-6-6v-1.5m12 0v1.5a6 6 0 0 1-.318 1.908M9.75 9.362V4.5a2.25 2.25 0 0 1 4.5 0v4.874" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          )}
          {audioMuted ? 'Unmute' : 'Mute'}
        </button>

        {/* Video toggle */}
        <button
          onClick={toggleVideo}
          disabled={!hasPermission || isPaused}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            videoDisabled
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {videoDisabled ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          )}
          {videoDisabled ? 'Show Camera' : 'Hide Camera'}
        </button>

        <div className="flex-1" />

        {/* Stream action buttons */}
        {status === 'idle' || status === 'disconnected' || status === 'error' ? (
          <button
            onClick={goLive}
            disabled={!hasPermission || isConnecting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-white rounded-full" />
            Go Live
          </button>
        ) : isConnecting ? (
          <button disabled className="bg-amber-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm opacity-75 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Connecting...
          </button>
        ) : isPaused ? (
          <>
            <button
              onClick={resumeStream}
              className="bg-jungle-600 hover:bg-jungle-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              Resume
            </button>
            <button
              onClick={endStream}
              className="bg-stone-800 hover:bg-stone-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
            >
              End Stream
            </button>
          </>
        ) : (
          <>
            <button
              onClick={pauseStream}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
            >
              Pause
            </button>
            <button
              onClick={endStream}
              className="bg-stone-800 hover:bg-stone-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
            >
              End Stream
            </button>
          </>
        )}
      </div>

      {/* Device selectors */}
      {hasPermission && !isPaused && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => handleDeviceChange('camera', e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-jungle-400"
            >
              {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Microphone</label>
            <select
              value={selectedMic}
              onChange={(e) => handleDeviceChange('mic', e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-stone-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-jungle-400"
            >
              {microphones.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
