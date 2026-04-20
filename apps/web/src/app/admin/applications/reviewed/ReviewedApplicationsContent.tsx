import { fetchAdminApplications } from '@/lib/admin-applications'
import { ApplicationCard } from '@/components/admin/ApplicationCard'

export async function ReviewedApplicationsContent() {
  const apps = await fetchAdminApplications({ status: 'reviewed' })

  if (apps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-400">
        <p className="text-3xl mb-3">🌿</p>
        <p className="font-medium">Nothing reviewed yet.</p>
      </div>
    )
  }

  const approved = apps.filter((a) => a.status === 'approved')
  const rejected = apps.filter((a) => a.status === 'rejected')

  return (
    <div className="space-y-10">
      {approved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Approved <span className="text-stone-300 font-normal normal-case tracking-normal">({approved.length})</span>
          </h2>
          <div className="space-y-3">
            {approved.map((app) => (
              <ApplicationCard key={app.id} app={app} readOnly />
            ))}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
            Rejected <span className="text-stone-300 font-normal normal-case tracking-normal">({rejected.length})</span>
          </h2>
          <div className="space-y-3">
            {rejected.map((app) => (
              <ApplicationCard key={app.id} app={app} readOnly />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
