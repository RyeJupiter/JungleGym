import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { TreehouseSkeleton } from '@/components/skeletons'
import { TreehouseContent } from './TreehouseContent'
import type { Metadata } from 'next'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createServerSupabaseClient()
  const { data: metaProfile } = await supabase
    .from('profiles')
    .select('display_name, tagline')
    .eq('username', username)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mp = metaProfile as any
  if (!mp) return { title: `@${username}` }
  return {
    title: `${mp.display_name} (@${username}) — JungleGym`,
    description: mp.tagline ?? undefined,
  }
}

export default async function TreehousePage({ params }: Props) {
  const { username } = await params

  return (
    <div>
      <Navbar />
      <Suspense fallback={<TreehouseSkeleton />}>
        <TreehouseContent username={username} />
      </Suspense>
    </div>
  )
}
