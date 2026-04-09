import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy – JungleGym',
  description: 'How JungleGym collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-jungle-900 px-6 py-4">
        <Link href="/" className="font-black text-xl text-white">
          jungle<span className="text-jungle-400">gym</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-jungle-900 mb-2">Privacy Policy</h1>
        <p className="text-stone-500 text-sm mb-8">Last updated: April 9, 2026</p>

        <div className="bg-jungle-50 border border-jungle-200 rounded-xl px-6 py-5 mb-12 text-stone-700 leading-relaxed">
          <p>
            Your rights are important to us. We believe in transparency so that you may exercise
            your informed consent — to work with us, or not. If you have any further questions,
            please{' '}
            <a href="mailto:rye@junglegym.academy" className="text-jungle-600 underline">
              reach out
            </a>
            .
          </p>
        </div>

        <div className="space-y-10 text-stone-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">1. Who we are</h2>
            <p>
              JungleGym (<strong>junglegym.academy</strong>) is a platform for fitness creators to
              publish video classes and for students to discover and purchase them. We are operated
              by Jovian Productions. Questions about this policy can be sent to{' '}
              <a href="mailto:rye@junglegym.academy" className="text-jungle-600 underline">
                rye@junglegym.academy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">2. Information we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account information</strong> — your name, email address, and profile photo
                when you create an account (directly or via Google Sign-In).
              </li>
              <li>
                <strong>Creator information</strong> — bio, teaching style, and any content you
                upload to the platform.
              </li>
              <li>
                <strong>Purchase history</strong> — which videos you have purchased and when.
              </li>
              <li>
                <strong>Payment information</strong> — billing details are collected and stored
                directly by <strong>Stripe</strong>. We never see or store your full card number.
              </li>
              <li>
                <strong>Usage data</strong> — pages visited, videos watched, and interactions with
                the platform, collected to improve recommendations and platform quality.
              </li>
              <li>
                <strong>Communications</strong> — if you contact us by email or through the
                platform, we retain those records.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and manage your account</li>
              <li>To process payments and deliver purchased content</li>
              <li>To surface relevant classes and creators through our recommendation system</li>
              <li>To communicate important platform updates, receipts, and support responses</li>
              <li>To detect fraud and maintain platform security</li>
              <li>To improve the platform based on how it is used</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your personal information to third parties, and we do
              not use your data for advertising outside of JungleGym.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">4. Third-party services</h2>
            <p>We share data with the following trusted services to operate the platform:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Supabase</strong> — our authentication and database provider. Stores your
                account data securely.
              </li>
              <li>
                <strong>Stripe</strong> — payment processing and creator payouts via Stripe
                Connect. Subject to{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-jungle-600 underline"
                >
                  Stripe's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Google</strong> — if you sign in with Google, your basic profile
                information is shared with us per your Google account settings.
              </li>
              <li>
                <strong>Cloudflare</strong> — hosts the platform and may process request-level
                data for security and performance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">5. Content sharing</h2>
            <p>
              Each user who purchases a video may share access with <strong>one other person</strong>{' '}
              using our built-in share feature. That person's access is linked to your account. We
              log shares to prevent abuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">6. Data retention</h2>
            <p>
              We retain your account data for as long as your account is active. Purchase records
              are retained for legal and financial compliance purposes. You may request deletion of
              your account at any time (see Section 7).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">7. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{' '}
              <a href="mailto:rye@junglegym.academy" className="text-jungle-600 underline">
                rye@junglegym.academy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">8. Cookies</h2>
            <p>
              JungleGym uses cookies and local storage for authentication sessions and platform
              preferences. We do not use third-party advertising cookies. You can disable cookies
              in your browser settings, though some features may not work correctly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">9. Children's privacy</h2>
            <p>
              JungleGym is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has created an account, please
              contact us and we will remove it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated
              via email or a notice on the platform. Continued use after changes take effect
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">11. Contact</h2>
            <p>
              Questions or concerns? Email{' '}
              <a href="mailto:rye@junglegym.academy" className="text-jungle-600 underline">
                rye@junglegym.academy
              </a>
              .
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-stone-200 flex gap-6 text-sm text-stone-500">
          <Link href="/policies/terms" className="hover:text-jungle-700 underline">
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-jungle-700 underline">
            Back to JungleGym
          </Link>
        </div>
      </main>
    </div>
  )
}
