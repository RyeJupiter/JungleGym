'use client'

import { useEffect } from 'react'

/**
 * Parallax scroll driver for the homepage forest background.
 *
 * Instead of rendering a separate background div (which caused compositor
 * hiccups with position:fixed and visible lag with position:absolute),
 * this component simply listens for scroll events and updates the
 * background-position of any element marked with data-parallax-bg.
 *
 * The actual background image + background-attachment:fixed live on the
 * section elements themselves (hero, philosophy). This means:
 * - No extra DOM layer for the compositor to fight over
 * - No oversized div extending the page scroll area
 * - backdrop-filter works naturally (same stacking context)
 * - The image is only rendered within section bounds (lighter GPU load)
 */
export function ParallaxForest({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const bgs = document.querySelectorAll<HTMLElement>('[data-parallax-bg]')
    if (!bgs.length) return

    const update = () => {
      // background-attachment:fixed anchors the image to the viewport (0% scroll).
      // Shifting backgroundPosition downward at 30% of scrollY makes the
      // visible window of the image creep lower — the forest descends at 30%
      // speed while content scrolls at 100%. Climbing down the tree.
      const pos = `center ${-window.scrollY * 0.3}px`
      bgs.forEach((el) => { el.style.backgroundPosition = pos })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <>{children}</>
}
