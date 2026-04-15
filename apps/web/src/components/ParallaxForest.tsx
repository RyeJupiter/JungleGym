'use client'

import { useEffect, useRef } from 'react'

/**
 * Full-page parallax forest background.
 *
 * Uses position:absolute (not fixed) to avoid the compositor layer
 * occlusion bug where browsers skip rendering a fixed layer when it's
 * covered by opaque content, then "hiccup" when it becomes visible again.
 *
 * The bg naturally scrolls with the page at 100% speed. We push it back
 * DOWN at 70% of scroll speed, netting 30% upward scroll speed — the same
 * climbing-down-a-tree parallax feel, without the layer pop.
 */
export function ParallaxForest({ children }: { children: React.ReactNode }) {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return

    const update = () => {
      // bg is position:absolute — it naturally scrolls at 100% with the page.
      // Translating it DOWN at 70% of scrollY nets a 30% upward scroll speed:
      // viewport sees bg content lag behind the content panels.
      bg.style.transform = `translateY(${window.scrollY * 0.7}px)`
    }

    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="relative">
      {/* Parallax bg — absolute so it stays in the normal render flow */}
      <div
        ref={bgRef}
        className="absolute left-0 right-0 top-0 pointer-events-none -z-10 will-change-transform"
        style={{
          // Extra 1200px keeps the bg from running out at the bottom as it
          // lags behind — same buffer math as before
          height: 'calc(100% + 1200px)',
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
