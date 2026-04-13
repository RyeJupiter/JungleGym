import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-black text-2xl text-stone-900">
            jungle<span className="text-jungle-600">gym</span>
          </a>
          <h1 className="text-3xl font-black text-stone-900 mt-6">Welcome back</h1>
          <p className="text-stone-500 mt-2">Good to see you again.</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
