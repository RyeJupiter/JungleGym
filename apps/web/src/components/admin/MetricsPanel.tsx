type CreatorPayout = {
  userId: string
  displayName: string
  username: string
  email: string
  videoEarnings: number
  giftEarnings: number
  totalOwed: number
}

type RecentPurchase = {
  id: string
  createdAt: string
  tier: string
  amountPaid: number
  platformAmount: number
  totalAmount: number
  buyerName: string
  buyerEmail: string
  videoTitle: string
  creatorName: string
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
  recentPurchases: RecentPurchase[]
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
  const { stats, payouts, recentPurchases } = data

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
            label="Platform tips"
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

      {/* ── Creator Payouts ── */}
      <section>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Creator payouts</h2>
        {payouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
            <p className="font-medium">No creators yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100">
                <tr className="text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Creator</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Video sales</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Gifts</th>
                  <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Total owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payouts.map((p) => (
                  <tr key={p.userId}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-900">{p.displayName}</p>
                      <p className="text-xs text-stone-400">@{p.username} · {p.email}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-stone-700">{fmt(p.videoEarnings)}</td>
                    <td className="px-5 py-4 text-right text-stone-700">{fmt(p.giftEarnings)}</td>
                    <td className="px-5 py-4 text-right font-bold text-stone-900">{fmt(p.totalOwed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Recent Purchases ── */}
      <section>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Recent purchases</h2>
        {recentPurchases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
            <p className="font-medium">No purchases yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
            {recentPurchases.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{p.videoTitle}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {p.buyerName} → {p.creatorName} ·{' '}
                    <span className="capitalize">{p.tier}</span> ·{' '}
                    {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-stone-900">{fmt(p.amountPaid)}</p>
                  {p.platformAmount > 0 && (
                    <p className="text-xs text-stone-400">+{fmt(p.platformAmount)} tip</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
