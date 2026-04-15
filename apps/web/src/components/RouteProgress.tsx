'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'

function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'idle' | 'loading' | 'complete'>('idle')
  const [width, setWidth] = useState(0)
  const trickleRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const resetRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const start = useCallback(() => {
    if (resetRef.current) clearTimeout(resetRef.current)
    if (trickleRef.current) clearInterval(trickleRef.current)
    setState('loading')
    setWidth(20)
    trickleRef.current = setInterval(() => {
      setWidth(w => (w >= 90 ? w : w + (90 - w) * 0.1))
    }, 200)
  }, [])

  const complete = useCallback(() => {
    if (trickleRef.current) clearInterval(trickleRef.current)
    setState('complete')
    setWidth(100)
    resetRef.current = setTimeout(() => {
      setState('idle')
      setWidth(0)
    }, 300)
  }, [])

  // Complete on route change
  useEffect(() => {
    if (state === 'loading') complete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Intercept clicks on internal links
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || anchor.target === '_blank') return
      const url = new URL(href, window.location.origin)
      if (url.pathname === pathname && url.search === window.location.search) return
      start()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname, start])

  // Safety timeout — complete after 8s even if route change isn't detected
  useEffect(() => {
    if (state !== 'loading') return
    const t = setTimeout(complete, 8000)
    return () => clearTimeout(t)
  }, [state, complete])

  if (state === 'idle') return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className={`h-full bg-jungle-400 ${state === 'complete' ? 'transition-all duration-200' : 'transition-all duration-500 ease-out'}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function RouteProgress() {
  return (
    <Suspense>
      <ProgressBar />
    </Suspense>
  )
}
