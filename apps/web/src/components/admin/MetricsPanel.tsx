'use client'

import { useMemo, useState } from 'react'

export type CreatorPayout = {
  userId: string
  displayName: string
  username: string
  email: string
  videoEarnings: number
  giftEarnings: number
  creatorCut: number
}

export type CreatorRosterEntry = {
  userId: string
  displayName: string
  username: string
  email: string
}

export type UnifiedTransaction = {
  id: string
  type: 'purchase' | 'gift'
  createdAt: string
  amount: number
  platformAmount: number
  totalAmount: number
  creatorName: string
  creatorUserId: string
  // Purchase-specific
  tier?: string
  videoTitle?: string
  buyerName?: string
  buyerEmail?: string
  // Gift-specific
  giverName?: string
  giverEmail?: string
  sessionTitle?: string
  message?: string
}

type StaticStats = {
  totalUsers: number
  creators: number
  learners: number
  publishedVideos: number
  freeVideos: number
  paidVideos: number
}

export type MetricsData = {
  stats: StaticStats
  creators: CreatorRosterEntry[]
  allTransactions: UnifiedTransaction[]
}

import { CreatorPayoutsSection } from './CreatorPayoutsSection'
import { AllTransactionsSection } from './AllTransactionsSection'

type DateRange = 'week' | 'month' | 'year' | 'all'

const RANGE_LABELS: Record<DateRange, string> = {
  week: 'Week',
  month: 'Month',
  year: 'Year',
  all: 'All time',
}

const RANGE_SUBTITLES: Record<DateRange, string> = {
  week: 'last 7 days',
  month: 'last 30 days',
  year: 'last 365 days',
  all: 'all time',
}

function rangeStart(range: DateRange): number | null {
  if (range === 'all') return null
  const now = Date.now()
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 365
  return now - days * 24 * 60 * 60 * 1000
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-stone-900">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  )
}

function fmt(n: number) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function MetricsPanel({ data }: { data: MetricsData }) {
  const { stats, creators, allTransactions } = data
  const [range, setRange] = useState<DateRange>('all')

  const filteredTransactions = useMemo(() => {
    const start = rangeStart(range)
    if (start === null) return allTransactions
    return allTransactions.filter((t) => new Date(t.createdAt).getTime() >= start)
  }, [allTransactions, range])

  const moneyStats = useMemo(() => {
    let creatorRevenue = 0
    let platformRevenue = 0
    let grossRevenue = 0
    let purchaseCount = 0
    for (const t of filteredTransactions) {
      creatorRevenue += t.amount
      platformRevenue += t.platformAmount
      grossRevenue += t.totalAmount
      if (t.type === 'purchase') purchaseCount += 1
    }
    return { creatorRevenue, platformRevenue, grossRevenue, purchaseCount }
  }, [filteredTransactions])

  const payouts: CreatorPayout[] = useMemo(() => {
    const videoByCreator = new Map<string, number>()
    const giftByCreator = new Map<string, number>()
    for (const t of filteredTransactions) {
      if (!t.creatorUserId) continue
      const bucket = t.type === 'purchase' ? videoByCreator : giftByCreator
      bucket.set(t.creatorUserId, (bucket.get(t.creatorUserId) ?? 0) + t.amount)
    }
    return creators.map((c) => {
      const videoEarnings = videoByCreator.get(c.userId) ?? 0
      const giftEarnings = giftByCreator.get(c.userId) ?? 0
      return {
        userId: c.userId,
        displayName: c.displayName,
        username: c.username,
        email: c.email,
        videoEarnings,
        giftEarnings,
        creatorCut: videoEarnings + giftEarnings,
      }
    })
  }, [creators, filteredTransactions])

  return (
    <div className="space-y-12">

      {/* ── Date Range Selector ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Platform overview</h2>
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
            {(Object.keys(RANGE_LABELS) as DateRange[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  range === key
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total users"
            value={stats.totalUsers.toString()}
            sub={`${stats.creators} creator${stats.creators !== 1 ? 's' : ''} · ${stats.learners} learner${stats.learners !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Published videos"
            value={stats.publishedVideos.toString()}
            sub={`${stats.freeVideos} free · ${stats.paidVideos} paid`}
          />
          <StatCard
            label="Purchases"
            value={moneyStats.purchaseCount.toString()}
            sub={RANGE_SUBTITLES[range]}
          />
          <StatCard
            label="Creator payouts"
            value={fmt(moneyStats.creatorRevenue)}
            sub={`${RANGE_SUBTITLES[range]} · 80% via Stripe Connect`}
          />
          <StatCard
            label="Platform fees"
            value={fmt(moneyStats.platformRevenue)}
            sub={`${RANGE_SUBTITLES[range]} · JungleGym income (20%)`}
          />
          <StatCard
            label="Gross revenue"
            value={fmt(moneyStats.grossRevenue)}
            sub={`${RANGE_SUBTITLES[range]} · purchases + gifts`}
          />
        </div>
      </section>

      <CreatorPayoutsSection payouts={payouts} rangeLabel={RANGE_SUBTITLES[range]} />

      <AllTransactionsSection transactions={filteredTransactions} />

    </div>
  )
}
