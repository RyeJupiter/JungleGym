'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

export type TabId = 'account' | 'payments' | 'notifications'

export function SettingsTabs({
  tabs,
  children,
}: {
  tabs: { id: TabId; label: string }[]
  children: Record<TabId, React.ReactNode>
}) {
  return (
    <Suspense fallback={<SettingsTabsInner tabs={tabs} children={children} defaultTab="account" />}>
      <SettingsTabsWithParams tabs={tabs} children={children} />
    </Suspense>
  )
}

function SettingsTabsWithParams({
  tabs,
  children,
}: {
  tabs: { id: TabId; label: string }[]
  children: Record<TabId, React.ReactNode>
}) {
  const searchParams = useSearchParams()
  const paramTab = searchParams.get('tab') as TabId | null
  // If ?stripe=complete, open the payments tab automatically
  const stripeReturn = searchParams.get('stripe')
  const defaultTab = stripeReturn ? 'payments' : (paramTab && tabs.some((t) => t.id === paramTab) ? paramTab : 'account')

  return <SettingsTabsInner tabs={tabs} children={children} defaultTab={defaultTab} />
}

function SettingsTabsInner({
  tabs,
  children,
  defaultTab,
}: {
  tabs: { id: TabId; label: string }[]
  children: Record<TabId, React.ReactNode>
  defaultTab: TabId
}) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {children[activeTab]}
    </div>
  )
}
