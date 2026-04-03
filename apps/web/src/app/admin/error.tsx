'use client'

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-xl w-full space-y-4">
        <h1 className="text-lg font-bold text-red-700">Admin Error</h1>
        <p className="text-sm text-stone-700 font-mono whitespace-pre-wrap break-all">
          {error.message || 'Unknown error'}
        </p>
        {error.digest && (
          <p className="text-xs text-stone-400">Digest: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
