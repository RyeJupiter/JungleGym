'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function ShareButton({ videoId, isLoggedIn }: { videoId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [redeemedAt, setRedeemedAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleOpen() {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/video/${videoId}`)
      return
    }
    setOpen(true)
    if (link || redeemedAt) return // already fetched this session
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // Select-then-insert (not upsert). An UPSERT on conflict triggers the
      // UPDATE RLS path; video_shares only has SELECT + INSERT policies so
      // repeat clicks would 400. Share rows are immutable anyway — the
      // token is set once on creation.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing, error: selectErr } = await (supabase as any)
        .from('video_shares')
        .select('token, redeemed_by, redeemed_at')
        .eq('owner_user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle()
      if (selectErr) throw selectErr

      // Already used by a friend — UNIQUE(owner, video) means we can't
      // issue another one, and it would be misleading to show the same
      // link (the /share/[token] page will refuse redemption anyway).
      if (existing?.redeemed_by) {
        setRedeemedAt(existing.redeemed_at as string | null)
        return
      }

      let token: string | null = (existing?.token as string | null) ?? null
      if (!token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inserted, error: insertErr } = await (supabase as any)
          .from('video_shares')
          .insert({ video_id: videoId, owner_user_id: user.id })
          .select('token')
          .single()
        if (insertErr) throw insertErr
        token = inserted?.token ?? null
      }

      if (!token) throw new Error('Could not generate link')
      setLink(`${window.location.origin}/share/${token}`)
    } catch (err: unknown) {
      // Surface the real Supabase error to the console so we can triage
      // server-side errors that come back as 400 without an obvious cause.
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

  function handleSendEmail() {
    if (!link || !email) return
    const subject = encodeURIComponent("I'm sharing a class with you on JungleGym")
    const body = encodeURIComponent(
      `Hey! I wanted to share this class with you. Click the link below for 30 days of free access:\n\n${link}\n\nSign up or log in to JungleGym to redeem it.`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self')
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full mt-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        🎁 Share with a friend
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl">
            <h3 className="font-black text-stone-900 text-lg mb-1">Share this class</h3>
            <p className="text-stone-500 text-sm mb-6">
              Send this to one friend. They get 30 days of free access — your treat.
              One person, one redemption.
            </p>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {loading ? (
              <div className="text-center py-4 text-stone-400 text-sm">Generating link...</div>
            ) : redeemedAt ? (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center space-y-2">
                <div className="text-3xl">🎁</div>
                <p className="font-bold text-stone-900 text-sm">
                  You&apos;ve already shared this with a friend!
                </p>
                <p className="text-xs text-stone-500">
                  Claimed on {new Date(redeemedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}. Each class can only be shared once.
                </p>
              </div>
            ) : link ? (
              <div className="space-y-4">
                {/* Email invite */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Send via email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-jungle-400"
                    />
                    <button
                      onClick={handleSendEmail}
                      disabled={!email}
                      className="bg-jungle-600 hover:bg-jungle-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <div className="flex-1 border-t border-stone-200" />
                  or copy the link
                  <div className="flex-1 border-t border-stone-200" />
                </div>

                {/* Copy link */}
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={link}
                    className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-stone-600 text-sm bg-stone-50 focus:outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopy}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
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
