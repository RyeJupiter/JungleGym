import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

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
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
