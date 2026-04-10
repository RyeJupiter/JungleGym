# Cloudflare Stream Live Integration Plan

> **Status**: Scaffolding ready, not yet connected to Cloudflare Stream  
> **Last updated**: 2026-04-09  
> **Owner**: Davin

---

## Overview

JungleGym live sessions currently have scheduling, gifting, and status management — but no actual video streaming. This doc covers integrating **Cloudflare Stream Live** so creators can broadcast directly from OBS (or any RTMPS tool) and learners watch inline on the session detail page.

### Why Cloudflare Stream?

- Same account and billing as our Worker deployment
- API calls work directly from the Cloudflare Worker
- Cheapest option at our scale (~$0.11 for a 1-hour session with 50 viewers)
- Auto-records streams as VODs — could feed into the existing video system
- No additional vendor to manage

---

## Architecture

### Flow

```
Creator creates session → "Set up stream" on manage page
     → API route calls CF Stream to create live input
     → Creator gets RTMPS URL + stream key
     → Creator opens OBS, pastes creds, starts broadcasting

CF webhook fires live_input.connected
     → Our webhook route updates session status to "live"
     → Session detail page shows embedded player

Creator ends stream
     → CF webhook fires live_input.disconnected
     → Session auto-transitions to "completed"
     → Recording becomes available as VOD within 60 seconds
```

### New Database Columns

Add to `live_sessions` table:

```sql
ALTER TABLE public.live_sessions
  ADD COLUMN cf_input_id     TEXT,          -- Cloudflare live input UID
  ADD COLUMN cf_stream_key   TEXT,          -- RTMPS stream key (sensitive — only shown to creator)
  ADD COLUMN cf_playback_id  TEXT;          -- Customer subdomain code for playback URLs
```

**Migration**: `supabase/migrations/00015_cf_stream_columns.sql`

### New Environment Variables

| Variable | Type | How to set | Purpose |
|----------|------|-----------|---------|
| `CLOUDFLARE_STREAM_API_TOKEN` | Server-side | `wrangler secret put` | API token scoped to Stream (NOT the global API key) |
| `CLOUDFLARE_ACCOUNT_ID` | Server-side | `wrangler secret put` | Already known: `84ab6b52009b008ace23b1a3fb20aef3` |
| `CLOUDFLARE_STREAM_CUSTOMER_CODE` | Server-side | `wrangler secret put` | The `customer-XXXX` subdomain prefix for playback URLs |
| `CLOUDFLARE_STREAM_WEBHOOK_SECRET` | Server-side | `wrangler secret put` | Shared secret to verify webhook signatures |

**Important**: Use a scoped API **Token** (not the Global API Key) for Stream operations. Create one in the CF dashboard: Account → API Tokens → Create Token → Custom → Stream:Edit permission.

---

## Cloudflare Stream API Reference

### Create a Live Input

```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs

Headers:
  Authorization: Bearer {API_TOKEN}
  Content-Type: application/json

Body:
{
  "meta": { "name": "Session: Morning Flow with Emily" },
  "recording": { "mode": "automatic" },
  "timeoutSeconds": 300,
  "preferLowLatency": true
}
```

**Response:**
```json
{
  "result": {
    "uid": "live-input-uid-here",
    "rtmps": {
      "url": "rtmps://live.cloudflare.com:443/live/",
      "streamKey": "abc123def456..."
    },
    "created": "2026-04-09T...",
    "modified": "2026-04-09T...",
    "meta": { "name": "Session: Morning Flow with Emily" },
    "status": null,
    "recording": { "mode": "automatic" },
    "enabled": true
  },
  "success": true
}
```

**Key fields to store:**
- `result.uid` → `cf_input_id`
- `result.rtmps.streamKey` → `cf_stream_key`

### Playback URLs (derived, not stored)

```
Iframe:   https://customer-{CODE}.cloudflarestream.com/{cf_input_id}/iframe
HLS:      https://customer-{CODE}.cloudflarestream.com/{cf_input_id}/manifest/video.m3u8
```

Using the **Live Input ID** means the player always shows the active broadcast (or "not started" if idle). Using a **Video ID** shows one specific recording.

### Webhook Events

Configured via CF Dashboard → Notifications → Stream.

| Event | `event_type` | When |
|-------|-------------|------|
| Stream starts | `live_input.connected` | Creator starts broadcasting |
| Stream ends | `live_input.disconnected` | Creator stops / connection drops |
| Error | `live_input.errored` | Bad codec, GOP interval, quota issue |

**Webhook payload:**
```json
{
  "name": "Stream Live Notifications",
  "text": "Live input connected",
  "data": {
    "notification_name": "...",
    "input_id": "the-live-input-uid",
    "event_type": "live_input.connected",
    "updated_at": "2026-04-09T..."
  },
  "ts": 1712649600
}
```

### Get Recordings for an Input

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs/{input_id}/videos
```

Returns a list of Video objects with HLS URLs. Recordings are available within 60 seconds of stream end.

---

## New API Routes

### `POST /api/stream/provision`

Called when creator clicks "Set up stream" on the manage page.

1. Verify auth + creator owns the session
2. Call CF Stream API to create a live input
3. Store `cf_input_id` and `cf_stream_key` on the `live_sessions` row
4. Return the RTMPS URL and stream key to the creator

### `POST /api/webhooks/cloudflare-stream`

Receives webhook events from Cloudflare.

1. Verify webhook signature/secret
2. Parse `event_type`:
   - `live_input.connected` → find session by `cf_input_id`, set `status = 'live'`
   - `live_input.disconnected` → set `status = 'completed'`
   - `live_input.errored` → log error, optionally notify creator
3. Use service role Supabase client (no user auth on webhooks)

### `GET /api/stream/[sessionId]/status` (optional)

Polls CF API for live input status. Useful as a fallback if webhooks are delayed. The manage page can poll this every 10 seconds while waiting for the stream to connect.

---

## UI Changes

### Session Manage Page (Creator)

Add a **"Stream"** tab (alongside Overview and Settings):

**Before stream is set up:**
```
┌─────────────────────────────────────────┐
│  📡 Live Streaming                       │
│                                          │
│  Set up streaming for this session.      │
│  You'll get an RTMPS URL to paste into   │
│  OBS or your streaming software.         │
│                                          │
│  [Set up stream]                         │
└─────────────────────────────────────────┘
```

**After stream is provisioned:**
```
┌─────────────────────────────────────────┐
│  📡 Stream Setup                         │
│                                          │
│  RTMPS URL                               │
│  rtmps://live.cloudflare.com:443/live/   │
│  [Copy]                                  │
│                                          │
│  Stream Key                              │
│  •••••••••••••• [Show] [Copy]            │
│                                          │
│  Status: ⚪ Idle / 🔴 Live              │
│                                          │
│  Paste these into OBS → Settings →       │
│  Stream → Service: Custom → paste URL    │
│  and key.                                │
└─────────────────────────────────────────┘
```

### Session Detail Page (Viewer)

Replace the current placeholder panel with an embedded player when the session is live:

**When live:**
```
┌─────────────────────────────────────────┐
│                                          │
│         [CF Stream Player iframe]        │
│         (16:9 responsive)                │
│                                          │
└─────────────────────────────────────────┘
│  🔴 Live now  ·  🎁 Send a gift         │
```

**When not yet live (has stream provisioned):**
```
┌─────────────────────────────────────────┐
│  🌿 Stream starts soon                  │
│  Come back [weekday] to watch live.      │
│  📅 Add to calendar                      │
└─────────────────────────────────────────┘
```

**When completed (recording available):**
```
┌─────────────────────────────────────────┐
│                                          │
│       [Recording playback player]        │
│                                          │
└─────────────────────────────────────────┘
│  This session has ended. Watch replay.   │
```

---

## Scaffolding (Build Now, Connect Later)

These are the files to create now with mock/stub behavior so the UI is ready. When Cloudflare Stream is enabled, just add the env vars and the stubs become real.

### Files to create:

1. **`apps/web/src/lib/cloudflare-stream.ts`** — CF Stream API client
   - `provisionLiveInput(sessionTitle)` — creates live input (stubbed: returns mock data if no API token)
   - `getLiveInputStatus(inputId)` — checks stream status
   - `getRecordings(inputId)` — lists recordings
   - `isStreamEnabled()` — checks if `CLOUDFLARE_STREAM_API_TOKEN` is set

2. **`apps/web/src/app/api/stream/provision/route.ts`** — provision endpoint

3. **`apps/web/src/app/api/webhooks/cloudflare-stream/route.ts`** — webhook handler

4. **`apps/web/src/components/session/StreamPlayer.tsx`** — responsive iframe/HLS player
   - Shows "Stream not started" when idle
   - Shows player when live
   - Shows recording when completed

5. **`apps/web/src/components/studio/StreamSetup.tsx`** — stream credentials panel for manage page

6. **`supabase/migrations/00015_cf_stream_columns.sql`** — new columns

### What "just hook it up" means:

1. Create a scoped API token in CF dashboard (Stream:Edit)
2. `wrangler secret put CLOUDFLARE_STREAM_API_TOKEN`
3. `wrangler secret put CLOUDFLARE_STREAM_CUSTOMER_CODE`
4. `wrangler secret put CLOUDFLARE_STREAM_WEBHOOK_SECRET`
5. Run migration 00015 in Supabase SQL editor
6. Set up webhook notification in CF dashboard → point to `https://junglegym.academy/api/webhooks/cloudflare-stream`
7. Done — everything lights up

---

## Pricing Estimate

| Metric | Rate | Example (1hr, 50 viewers) |
|--------|------|---------------------------|
| Storage/encoding | $5 / 1,000 min | $0.005 per session |
| Delivery | $1 / 1,000 viewer-min | $0.05 per session |
| **Total** | | **~$0.06 per session** |
| Monthly (10 sessions, 50 avg viewers) | | **~$0.60 + $5 base = $5.60** |

---

## Future Enhancements

- **Real-time chat**: Supabase Realtime on a `session_messages` table, overlaid on the player
- **Gift animations**: Show gift toasts on-screen for all viewers in real-time
- **Auto-VOD import**: When a recording is ready, auto-create a `videos` row so it shows up in the creator's library
- **Simulcast**: CF Stream supports restreaming to YouTube/Twitch simultaneously
- **WebRTC (sub-second latency)**: CF has a beta WebRTC output — useful for interactive sessions
- **Viewer count**: CF Stream API provides concurrent viewer count — show it on the session page

---

## References

- [Start a live stream — CF Docs](https://developers.cloudflare.com/stream/stream-live/start-stream-live/)
- [Watch a live stream — CF Docs](https://developers.cloudflare.com/stream/stream-live/watch-live-stream/)
- [Live webhooks — CF Docs](https://developers.cloudflare.com/stream/stream-live/webhooks/)
- [Replay recordings — CF Docs](https://developers.cloudflare.com/stream/stream-live/replay-recordings/)
- [Stream Player — CF Docs](https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/)
- [Stream pricing — CF Docs](https://developers.cloudflare.com/stream/)
