import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 — Page not found' }

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🌿</div>
        <h1 className="text-5xl font-black text-jungle-900 mb-3">404</h1>
        <p className="text-jungle-700 text-lg mb-8">This page doesn&apos;t exist — or it moved.</p>
        <Link
          href="/explore"
          className="bg-jungle-900 hover:bg-jungle-800 text-white font-bold px-8 py-3 rounded-xl inline-block transition-colors"
        >
          Back to explore
        </Link>
      </div>
    </div>
  )
}
