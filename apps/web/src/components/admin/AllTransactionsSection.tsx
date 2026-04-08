'use client'

import { useState, useMemo } from 'react'
import type { UnifiedTransaction } from './MetricsPanel'

type SortOption = 'date' | 'amount' | 'type'
type TypeFilter = 'all' | 'purchase' | 'gift'

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function AllTransactionsSection({ transactions }: { transactions: UnifiedTransaction[] }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [filterType, setFilterType] = useState<TypeFilter>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return transactions
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false
        if (!q) return true
        return (
          (t.buyerName?.toLowerCase().includes(q)) ||
          (t.giverName?.toLowerCase().includes(q)) ||
          t.creatorName.toLowerCase().includes(q) ||
          (t.videoTitle?.toLowerCase().includes(q)) ||
          (t.sessionTitle?.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'amount':
            return b.totalAmount - a.totalAmount
          case 'type':
            return a.type.localeCompare(b.type) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
      })
  }, [transactions, search, sortBy, filterType])

  return (
    <section>
      <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">All transactions</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
        />
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {(['all', 'purchase', 'gift'] as TypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                filterType === type
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {type === 'all' ? 'All' : type === 'purchase' ? 'Purchases' : 'Gifts'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {(['date', 'amount', 'type'] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                sortBy === opt
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {opt === 'date' ? 'Date' : opt === 'amount' ? 'Amount' : 'Type'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
          <p className="font-medium">{search || filterType !== 'all' ? 'No transactions match your filters' : 'No transactions yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {filtered.map((t) => (
            <div key={`${t.type}-${t.id}`} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                    t.type === 'purchase'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-purple-50 text-purple-600'
                  }`}>
                    {t.type}
                  </span>
                  <p className="font-semibold text-stone-900 truncate">
                    {t.type === 'purchase' ? t.videoTitle : t.sessionTitle}
                  </p>
                </div>
                <p className="text-xs text-stone-400">
                  {t.type === 'purchase' ? t.buyerName : t.giverName} &rarr; {t.creatorName}
                  {t.type === 'purchase' && t.tier && (
                    <> · <span className="capitalize">{t.tier}</span></>
                  )}
                  {' · '}
                  {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {t.type === 'gift' && t.message && (
                  <p className="text-xs text-stone-400 mt-1 italic">&ldquo;{t.message}&rdquo;</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-stone-900">{fmt(t.amount)}</p>
                {t.platformAmount > 0 && (
                  <p className="text-xs text-stone-400">+{fmt(t.platformAmount)} tip</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
