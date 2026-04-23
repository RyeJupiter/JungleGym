/**
 * Cloudflare Stream Live API client.
 *
 * When CLOUDFLARE_STREAM_API_TOKEN is not set, all functions return
 * graceful "not enabled" responses so the UI can render placeholder states.
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

function getConfig() {
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE
  return { token, accountId, customerCode }
}

export function isStreamEnabled(): boolean {
  const { token, accountId } = getConfig()
  return !!(token && accountId)
}

export function getPlaybackUrls(inputId: string) {
  const { customerCode } = getConfig()
  if (!customerCode || !inputId) return null
  const base = `https://customer-${customerCode}.cloudflarestream.com/${inputId}`
  return {
    iframe: `${base}/iframe`,
    hls: `${base}/manifest/video.m3u8`,
  }
}

/**
 * Derives a basic WHIP URL from the input ID. This is NOT a signed URL
 * and won't work for auth — use getSignedWhipUrl() for actual WHIP calls.
 * Kept for display/reference purposes only.
 */
export function getWhipUrl(inputId: string): string | null {
  const { customerCode } = getConfig()
  if (!customerCode || !inputId) return null
  return `https://customer-${customerCode}.cloudflarestream.com/${inputId}/webRTC/publish`
}

/**
 * Fetches the signed WHIP URL from CF's API. The signed URL contains
 * the auth token in the path — no separate Bearer header needed.
 */
export async function getSignedWhipUrl(inputId: string): Promise<string | null> {
  const { token, accountId } = getConfig()
  if (!token || !accountId) return null

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/live_inputs/${inputId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const data = await res.json()
  if (!data.success) return null

  return data.result?.webRTC?.url ?? null
}

// ── Create a live input for a session ─────────────────────────

export type ProvisionResult = {
  inputId: string
  rtmpsUrl: string
  streamKey: string
  webRtcUrl: string | null
}

export async function provisionLiveInput(
  sessionTitle: string
): Promise<ProvisionResult> {
  const { token, accountId } = getConfig()
  if (!token || !accountId) {
    throw new Error('Cloudflare Stream is not configured. Set CLOUDFLARE_STREAM_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.')
  }

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/live_inputs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: { name: `JungleGym: ${sessionTitle}` },
        recording: { mode: 'automatic' },
        timeoutSeconds: 300,
        preferLowLatency: true,
      }),
    }
  )

  const data = await res.json()
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message ?? 'Failed to create live input')
  }

  return {
    inputId: data.result.uid,
    rtmpsUrl: data.result.rtmps.url,
    streamKey: data.result.rtmps.streamKey,
    webRtcUrl: data.result.webRTC?.url ?? null,
  }
}

// ── Check live input status ──────────────────────────────────

export type StreamStatus = {
  state: 'connected' | 'disconnected' | 'unknown'
  currentViewers?: number
}

export async function getLiveInputStatus(
  inputId: string
): Promise<StreamStatus> {
  const { token, accountId } = getConfig()
  if (!token || !accountId) return { state: 'unknown' }

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/live_inputs/${inputId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  const data = await res.json()
  if (!data.success) return { state: 'unknown' }

  // CF returns status as null when idle, or an object when connected
  const status = data.result?.status
  if (!status || status === null) return { state: 'disconnected' }

  return {
    state: status.current?.state === 'connected' ? 'connected' : 'disconnected',
    currentViewers: status.current?.viewerCount,
  }
}

// ── Direct Creator Upload (VOD) ──────────────────────────────

export type DirectUploadResult = {
  /** One-time URL the client POSTs the video file to (multipart/form-data, field "file"). */
  uploadURL: string
  /** Stream video UID — reserve this; use for playback once readyToStream. */
  uid: string
}

/**
 * Mint a one-time Direct Creator Upload URL. The client POSTs the raw file
 * to `uploadURL` — no auth header needed, the URL itself carries the token
 * and expires after use. Handles any format CF supports (.mov, .mp4, .mkv,
 * HEVC, etc.) up to the per-upload size limit.
 */
export async function createDirectUpload(opts: {
  maxDurationSeconds: number
  creator?: string
  meta?: Record<string, string>
}): Promise<DirectUploadResult> {
  const { token, accountId } = getConfig()
  if (!token || !accountId) {
    throw new Error('Cloudflare Stream is not configured.')
  }

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: opts.maxDurationSeconds,
        creator: opts.creator,
        meta: opts.meta,
        // Omit allowedOrigins — one-time URL is already single-use, and
        // restricting origins breaks local dev without ceremony.
      }),
    }
  )

  const data = await res.json()
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message ?? 'Failed to create direct upload')
  }

  return {
    uploadURL: data.result.uploadURL,
    uid: data.result.uid,
  }
}

export type VideoStatus = {
  /** Upload/processing pipeline state. Poll until readyToStream is true. */
  state: 'pendingupload' | 'downloading' | 'queued' | 'inprogress' | 'ready' | 'error'
  readyToStream: boolean
  errorMessage?: string
  duration?: number
  thumbnail?: string
}

export async function getVideoStatus(uid: string): Promise<VideoStatus | null> {
  const { token, accountId } = getConfig()
  if (!token || !accountId) return null

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const data = await res.json()
  if (!data.success) return null

  const r = data.result
  return {
    state: r.status?.state ?? 'pendingupload',
    readyToStream: !!r.readyToStream,
    errorMessage: r.status?.errorReasonText,
    duration: r.duration,
    thumbnail: r.thumbnail,
  }
}

export async function deleteStreamVideo(uid: string): Promise<boolean> {
  const { token, accountId } = getConfig()
  if (!token || !accountId) return false

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/${uid}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  return res.ok
}

// ── List recordings for a live input ─────────────────────────

export type Recording = {
  videoId: string
  created: string
  duration: number
  hlsUrl: string
  iframeUrl: string
}

export async function getRecordings(inputId: string): Promise<Recording[]> {
  const { token, accountId, customerCode } = getConfig()
  if (!token || !accountId) return []

  const res = await fetch(
    `${CF_API_BASE}/accounts/${accountId}/stream/live_inputs/${inputId}/videos`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  const data = await res.json()
  if (!data.success) return []

  return (data.result ?? []).map((v: Record<string, unknown>) => ({
    videoId: v.uid as string,
    created: v.created as string,
    duration: v.duration as number,
    hlsUrl: customerCode
      ? `https://customer-${customerCode}.cloudflarestream.com/${v.uid}/manifest/video.m3u8`
      : '',
    iframeUrl: customerCode
      ? `https://customer-${customerCode}.cloudflarestream.com/${v.uid}/iframe`
      : '',
  }))
}
