'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { CreatorPayout } from './MetricsPanel'

type SortOption = 'creatorCut' | 'videoEarnings' | 'giftEarnings' | 'alphabetical'

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const SORT_LABELS: Record<SortOption, string> = {
  creatorCut: 'Creator cut',
  videoEarnings: 'Video sales',
  giftEarnings: 'Gifts',
  alphabetical: 'A–Z',
}

export function CreatorPayoutsSection({
  payouts,
  rangeLabel,
}: {
  payouts: CreatorPayout[]
  rangeLabel?: string
}) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('creatorCut')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return payouts
      .filter((p) => {
        if (!q) return true
        return (
          p.displayName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'creatorCut':
            return b.creatorCut - a.creatorCut
          case 'videoEarnings':
            return b.videoEarnings - a.videoEarnings
          case 'giftEarnings':
            return b.giftEarnings - a.giftEarnings
          case 'alphabetical':
            return a.displayName.localeCompare(b.displayName)
        }
      })
  }, [payouts, search, sortBy])

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Creator payouts</h2>
        {rangeLabel && (
          <span className="text-xs text-stone-400">{rangeLabel}</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search creators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
        />
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                sortBy === key
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
          <p className="font-medium">{search ? 'No creators match your search' : 'No creators yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr className="text-left">
                <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Creator</th>
                <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Video sales</th>
                <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Gifts</th>
                <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Creator cut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((p) => (
                <tr key={p.userId} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/creators/${p.userId}`} className="block">
                      <p className="font-semibold text-stone-900">{p.displayName}</p>
                      <p className="text-xs text-stone-400">@{p.username} · {p.email}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-right text-stone-700">{fmt(p.videoEarnings)}</td>
                  <td className="px-5 py-4 text-right text-stone-700">{fmt(p.giftEarnings)}</td>
                  <td className="px-5 py-4 text-right font-bold text-stone-900">{fmt(p.creatorCut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
