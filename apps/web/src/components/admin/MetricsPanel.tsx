export type CreatorPayout = {
  userId: string
  displayName: string
  username: string
  email: string
  videoEarnings: number
  giftEarnings: number
  totalOwed: number
}

export type UnifiedTransaction = {
  id: string
  type: 'purchase' | 'gift'
  createdAt: string
  amount: number
  platformAmount: number
  totalAmount: number
  creatorName: string
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

type Stats = {
  totalUsers: number
  creators: number
  learners: number
  publishedVideos: number
  freeVideos: number
  paidVideos: number
  totalPurchases: number
  creatorRevenue: number
  platformRevenue: number
  grossRevenue: number
}

export type MetricsData = {
  stats: Stats
  payouts: CreatorPayout[]
  allTransactions: UnifiedTransaction[]
}

import { CreatorPayoutsSection } from './CreatorPayoutsSection'
import { AllTransactionsSection } from './AllTransactionsSection'

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
  const { stats, payouts, allTransactions } = data

  return (
    <div className="space-y-12">

      {/* ── Platform Overview ── */}
      <section>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Platform overview</h2>
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
            label="Total purchases"
            value={stats.totalPurchases.toString()}
          />
          <StatCard
            label="Creator revenue"
            value={fmt(stats.creatorRevenue)}
            sub="owed to teachers"
          />
          <StatCard
            label="Platform fees"
            value={fmt(stats.platformRevenue)}
            sub="JungleGym income"
          />
          <StatCard
            label="Gross revenue"
            value={fmt(stats.grossRevenue)}
            sub="purchases + gifts"
          />
        </div>
      </section>

      <CreatorPayoutsSection payouts={payouts} />

      <AllTransactionsSection transactions={allTransactions} />

    </div>
  )
}
