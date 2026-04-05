// Injects build-time env vars into the OpenNext worker bundle.
// Runs AFTER @opennextjs/cloudflare build, so the value can't be stripped.
const fs = require('fs')
const path = require('path')

const workerPath = path.join(__dirname, '..', '.open-next', 'worker.js')

if (!fs.existsSync(workerPath)) {
  console.error('[inject-env] .open-next/worker.js not found — skipping')
  process.exit(0)
}

const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) {
  console.warn('[inject-env] SUPABASE_SERVICE_ROLE_KEY not set — skipping injection')
  process.exit(0)
}

const worker = fs.readFileSync(workerPath, 'utf-8')
const injection = `globalThis.process=globalThis.process||{env:{}};globalThis.process.env=globalThis.process.env||{};globalThis.process.env.SUPABASE_SERVICE_ROLE_KEY=${JSON.stringify(key)};\n`
fs.writeFileSync(workerPath, injection + worker)

console.log(`[inject-env] Injected SUPABASE_SERVICE_ROLE_KEY into worker.js (length=${key.length})`)
