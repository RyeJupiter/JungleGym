import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Jungle Gym',
    template: '%s | Jungle Gym',
  },
  description: 'Learn movement from people who love it. Videos, live sessions, and real community.',
  keywords: ['movement', 'fitness', 'yoga', 'strength', 'personal training', 'creators'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
