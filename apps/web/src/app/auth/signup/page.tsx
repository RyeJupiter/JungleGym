import { SignupForm } from '@/components/auth/SignupForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Join' }

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-jungle-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-black text-2xl text-white">
            jungle<span className="text-jungle-400">gym</span>
          </a>
          <h1 className="text-3xl font-black text-white mt-6">Join the community</h1>
          <p className="text-jungle-400 mt-2">Find movement teachers you genuinely vibe with.</p>
        </div>
        <SignupForm />
      </div>
    </main>
  )
}
