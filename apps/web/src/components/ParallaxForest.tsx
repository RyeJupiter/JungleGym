'use client'

import { useEffect, useRef } from 'react'

/**
 * Full-page parallax forest background.
 *
 * The background scrolls up at 30% of the user's scroll speed — so the
 * forest "recedes" slower than the content, giving a climbing-down-a-tree
 * feeling as the content panels slide past.
 *
 * To use a real image instead of the CSS gradient, replace `background` below
 * with:  background: 'url(/jungle-bg.jpg) center top / cover no-repeat'
 */
export function ParallaxForest({ children }: { children: React.ReactNode }) {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return

    const update = () => {
      // As the user scrolls down (scrollY increases), shift the bg upward
      // at only 30% of the scroll speed — the forest lags behind the content.
      bg.style.transform = `translateY(${-window.scrollY * 0.3}px)`
    }

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="relative">
      {/* Parallax forest layer — fixed to viewport, but nudged by JS */}
      <div
        ref={bgRef}
        className="fixed left-0 right-0 top-0 pointer-events-none -z-10 will-change-transform"
        style={{
          // Extra 1200px of height so the div still covers the viewport
          // even after being translated up at maximum scroll depth
          // (rough math: 4000px page × 0.3 factor ≈ 1200px max shift)
          height: 'calc(100vh + 1200px)',
          // Use the real jungle image; gradient is a colour-matched fallback
          backgroundImage: "url('/jungle-gateway-web.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  )
}
