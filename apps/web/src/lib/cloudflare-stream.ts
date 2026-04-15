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

export function getWhipUrl(inputId: string): string | null {
  const { customerCode } = getConfig()
  if (!customerCode || !inputId) return null
  return `https://customer-${customerCode}.cloudflarestream.com/${inputId}/webRTC/publish`
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
