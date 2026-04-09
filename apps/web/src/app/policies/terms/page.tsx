import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service – JungleGym',
  description: 'The terms that govern your use of JungleGym.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-jungle-900 px-6 py-4">
        <Link href="/" className="font-black text-xl text-white">
          jungle<span className="text-jungle-400">gym</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/62/Ayeaye%2C_Daubentonia_madagascariensis%2C_Joseph_Wolf.jpg"
            alt="Aye-aye (Daubentonia madagascariensis) — watercolor by Joseph Wolf, c. 1863"
            className="w-48 h-auto opacity-80 mix-blend-multiply"
          />
          <p className="text-xs text-stone-400 mt-2 italic">
            Aye-aye · <em>Daubentonia madagascariensis</em> · Joseph Wolf, c. 1863 · public domain
          </p>
        </div>

        <h1 className="text-4xl font-black text-jungle-900 mb-2">Terms of Service</h1>
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
            <h2 className="text-xl font-bold text-jungle-900 mb-3">1. About JungleGym</h2>
            <p>
              JungleGym (<strong>junglegym.academy</strong>) is a platform that connects fitness
              creators with students through on-demand video classes. It is operated by Jovian
              Productions. By using JungleGym, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">2. Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>
                One person, one account. You may not share your login or create accounts on behalf
                of others without permission.
              </li>
              <li>
                You may sign up with an email address or via Google Sign-In. Both methods create
                the same type of account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">3. Purchasing videos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                When you purchase a video, you receive <strong>permanent access</strong> to that
                video for your personal use.
              </li>
              <li>
                Purchases are processed by <strong>Stripe</strong>. By completing a purchase, you
                agree to Stripe's terms of service.
              </li>
              <li>
                Prices are set by individual creators. JungleGym retains a{' '}
                <strong>20% platform fee</strong> on every transaction; the remaining 80% goes
                directly to the creator.
              </li>
              <li>
                All sales are final. Refunds are handled on a case-by-case basis — contact{' '}
                <a href="mailto:rye@junglegym.academy" className="text-jungle-600 underline">
                  rye@junglegym.academy
                </a>{' '}
                within 7 days of purchase if you believe a refund is warranted.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">4. Sharing access</h2>
            <p>
              Each purchased video may be shared with <strong>one other person</strong> using
              JungleGym's built-in share feature. This is a one-time, non-transferable share per
              purchase. Sharing access outside this feature — including redistributing video files
              or links — is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">5. Creator terms</h2>
            <p>
              Creators ("lead monkeys") are vetted and approved by JungleGym before publishing
              content. As a creator, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                Only upload content you own or have the rights to publish, including music,
                video footage, and any third-party materials.
              </li>
              <li>
                Not upload content that is illegal, harmful, deceptive, or violates the rights
                of others.
              </li>
              <li>
                Accept the <strong>80/20 revenue split</strong> — 80% to you, 20% to JungleGym —
                on all paid video sales. This is non-negotiable and applied automatically via
                Stripe Connect.
              </li>
              <li>
                Maintain a valid Stripe Connect account to receive payouts. JungleGym is not
                responsible for payment delays caused by Stripe or your banking institution.
              </li>
              <li>
                Offer at least one free video on the platform to help students discover your work.
              </li>
              <li>
                Ensure your content meets the quality standards communicated during the
                application process.
              </li>
            </ul>
            <p className="mt-3">
              JungleGym reserves the right to remove content or suspend creator accounts that
              violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">6. Prohibited conduct</h2>
            <p>You may not use JungleGym to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Scrape, copy, or redistribute platform content without authorization</li>
              <li>Attempt to circumvent payment systems or access paid content without purchase</li>
              <li>Harass, impersonate, or harm other users or creators</li>
              <li>Upload malware, spam, or any malicious content</li>
              <li>Violate any applicable law or regulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">7. Intellectual property</h2>
            <p>
              All platform software, design, and branding are owned by JungleGym / Jovian
              Productions. Creator-uploaded content remains the intellectual property of the
              creator. By uploading content, creators grant JungleGym a non-exclusive license to
              display, stream, and promote that content on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">8. Disclaimer of warranties</h2>
            <p>
              JungleGym is provided "as is." We make no guarantees about uptime, content quality,
              or fitness results. Fitness activities carry inherent physical risks — always consult
              a qualified professional before beginning a new exercise program. JungleGym is not
              liable for injury or harm resulting from participation in any class on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">9. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, JungleGym's total liability to you for any
              claim arising from your use of the platform is limited to the amount you paid to
              JungleGym in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">10. Termination</h2>
            <p>
              You may delete your account at any time. JungleGym may suspend or terminate accounts
              that violate these terms, with or without notice. Upon termination, your access to
              purchased content may be revoked at JungleGym's discretion where legally permitted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">11. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated
              via email or a platform notice. Continued use after changes take effect constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">12. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of California, USA, without regard
              to conflict of law principles. Any disputes will be resolved in the courts of Santa
              Cruz County, California.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-jungle-900 mb-3">13. Contact</h2>
            <p>
              Questions about these terms? Email{' '}
              <a href="mailto:rye@junglegym.academy" className="text-jungle-600 underline">
                rye@junglegym.academy
              </a>
              .
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-stone-200 flex gap-6 text-sm text-stone-500">
          <Link href="/policies/privacy" className="hover:text-jungle-700 underline">
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-jungle-700 underline">
            Back to JungleGym
          </Link>
        </div>
      </main>
    </div>
  )
}
