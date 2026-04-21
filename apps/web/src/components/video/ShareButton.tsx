'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type InitialShare = {
  token: string
  redeemedAt: string | null
  redeemerName: string | null
}

type Props = {
  videoId: string
  isLoggedIn: boolean
  /** Prefetched on the server so the button can reflect its state before any click. */
  initialShare?: InitialShare | null
}

/** "Ryan Mac Donald" → "Ryan"; caps length so names like rollerblading handles don't blow the button up. */
function firstName(name: string | null): string {
  if (!name) return 'a friend'
  const first = name.trim().split(/\s+/)[0] ?? 'a friend'
  return first.length > 18 ? first.slice(0, 16) + '…' : first
}

export function ShareButton({ videoId, isLoggedIn, initialShare }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<string | null>(initialShare?.token ?? null)
  const [redeemedAt, setRedeemedAt] = useState<string | null>(initialShare?.redeemedAt ?? null)
  const [redeemerName, setRedeemerName] = useState<string | null>(initialShare?.redeemerName ?? null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const claimed = !!redeemedAt
  const link = token && typeof window !== 'undefined'
    ? `${window.location.origin}/share/${token}`
    : null

  async function handleOpen() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/video/${videoId}`)
      return
    }
    setOpen(true)
    // If we already know the state from the server prefetch, nothing to load.
    if (token || claimed) return

    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // Select-then-insert (not upsert). video_shares only has SELECT + INSERT
      // RLS policies; an UPSERT would trigger the blocked UPDATE path.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing, error: selectErr } = await (supabase as any)
        .from('video_shares')
        .select('token, redeemed_by, redeemed_at')
        .eq('owner_user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle()
      if (selectErr) throw selectErr

      if (existing?.redeemed_by) {
        setRedeemedAt(existing.redeemed_at as string | null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: redeemerProfile } = await (supabase as any)
          .from('profiles')
          .select('display_name')
          .eq('user_id', existing.redeemed_by)
          .maybeSingle()
        setRedeemerName((redeemerProfile?.display_name as string | null) ?? null)
        return
      }

      let nextToken: string | null = (existing?.token as string | null) ?? null
      if (!nextToken) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inserted, error: insertErr } = await (supabase as any)
          .from('video_shares')
          .insert({ video_id: videoId, owner_user_id: user.id })
          .select('token')
          .single()
        if (insertErr) throw insertErr
        nextToken = inserted?.token ?? null
      }

      if (!nextToken) throw new Error('Could not generate link')
      setToken(nextToken)
    } catch (err: unknown) {
      console.error('[ShareButton] failed to generate link:', err)
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Could not generate link'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={
          claimed
            ? `Shared with ${redeemerName ?? 'a friend'}`
            : 'Share this class with a friend'
        }
        className={`w-full mt-3 font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 ${
          claimed
            ? 'bg-jungle-50 hover:bg-jungle-100 text-jungle-800 border border-jungle-200'
            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
        }`}
      >
        {claimed ? (
          <>
            <span aria-hidden>✓</span>
            <span className="truncate">
              Shared with {firstName(redeemerName)}
            </span>
          </>
        ) : (
          <>🎁 Share with a friend</>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
            <h3 className="font-black text-stone-900 text-lg mb-1">
              {claimed ? 'Share claimed' : 'Share this class'}
            </h3>
            <p className="text-stone-500 text-sm mb-6">
              {claimed
                ? "Each class can only be shared once. Your friend got 30 days of access."
                : 'Send this to one friend. They get 30 days of free access — your treat. One person, one redemption.'}
            </p>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {loading ? (
              <div className="text-center py-4 text-stone-400 text-sm">Generating link…</div>
            ) : claimed ? (
              <div className="bg-jungle-50 border border-jungle-200 rounded-xl p-5 text-center space-y-1.5">
                <div className="text-3xl">🎁</div>
                <p className="font-bold text-jungle-900 text-sm">
                  Claimed by {redeemerName ?? 'a friend'}
                </p>
                {redeemedAt && (
                  <p className="text-xs text-jungle-700/80">
                    on {new Date(redeemedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ) : link ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                    Share link
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={link}
                      className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-stone-600 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={handleCopy}
                      className={`font-semibold px-4 py-2 rounded-lg text-sm transition-colors ${
                        copied
                          ? 'bg-jungle-600 text-white'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                      }`}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-stone-400 text-center">
                  One-time redemption. Your friend gets 30 days of access.
                </p>
              </div>
            ) : null}

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full text-stone-400 hover:text-stone-600 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
