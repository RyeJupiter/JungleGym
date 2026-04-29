# External Services — TODO

Keys, accounts, and third-party service settings that need to be rotated, transferred, or reconfigured. Add an entry whenever something is set up under a personal account that should eventually live under a JungleGym-owned one, or when a key needs rotating.

- [ ] Switch Groq API token to a JungleGym-owned API token
  - Currently using a personal Groq key set as the `GROQ_API_KEY` Worker secret
  - Used by: ghost-tag generation (`/api/videos/create`, edit page) and audio transcription (`/api/transcribe/[videoId]`)
  - Steps: create a JungleGym-owned Groq account → generate a new API key → `wrangler secret put GROQ_API_KEY --name junglegym` to rotate → revoke the old personal key
