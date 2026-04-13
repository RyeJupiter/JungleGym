import Link from 'next/link'

export function FooterCompact() {
  return (
    <footer className="border-t border-stone-200 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
        <span>&copy; 2026 JungleGym</span>
        <div className="flex items-center gap-4">
          <Link href="/why" className="hover:text-stone-600 transition-colors">Why</Link>
          <Link href="/policies/terms" className="hover:text-stone-600 transition-colors">Terms</Link>
          <Link href="/policies/privacy" className="hover:text-stone-600 transition-colors">Privacy</Link>
          <Link href="/contact" className="hover:text-stone-600 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
