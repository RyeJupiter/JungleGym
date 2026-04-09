import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contact Us — JungleGym' }

export default async function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-jungle-900 mb-4">Contact Us</h1>

          <p className="text-jungle-700 leading-relaxed mb-6">
            Have a question, want to teach, or just want to say hi? Reach out.
          </p>

          <a
            href="mailto:rye@junglegym.academy"
            className="inline-block text-lg font-semibold text-jungle-400 hover:text-jungle-300 transition-colors underline underline-offset-4"
          >
            rye@junglegym.academy
          </a>

          <div className="mt-10 pt-8 border-t border-stone-200 text-sm text-jungle-600">
            <p>
              Interested in teaching on JungleGym?{' '}
              <Link href="/apply" className="font-semibold text-jungle-400 hover:text-jungle-300 transition-colors underline underline-offset-2">
                Apply here
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
