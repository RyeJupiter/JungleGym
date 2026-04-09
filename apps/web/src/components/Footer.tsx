import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-jungle-900 border-t border-jungle-800 text-jungle-400">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="font-black text-xl text-white">
              jungle<span className="text-jungle-400">gym</span>
            </Link>
            <p className="mt-3 text-sm text-jungle-500 leading-relaxed">
              Movement classes from skilled guides.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-jungle-500 mb-4">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-white transition-colors">
                  Live Sessions
                </Link>
              </li>
              <li>
                <Link href="/apply" className="hover:text-white transition-colors">
                  Apply to Teach
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-jungle-500 mb-4">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/why" className="hover:text-white transition-colors">
                  Why JungleGym
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-jungle-800 text-xs text-jungle-500">
          &copy; 2026 JungleGym
        </div>
      </div>
    </footer>
  )
}
