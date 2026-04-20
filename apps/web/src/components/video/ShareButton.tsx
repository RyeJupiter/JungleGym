'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export function ShareButton({ videoId, isLoggedIn }: { videoId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<string | null>(null)
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
    if (link) return // already fetched
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('video_shares')
        .upsert(
          { video_id: videoId, owner_user_id: user.id },
          { onConflict: 'owner_user_id,video_id', ignoreDuplicates: false }
        )
        .select('token')
        .single()
      if (error) throw error
      setLink(`${window.location.origin}/api/share/${data.token}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not generate link')
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
