'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { TreehouseConfig } from '@/components/treehouse/config'
import type { TreehouseData } from '@/components/treehouse/sections/SectionRenderer'
import { TreehouseRenderer } from '@/components/treehouse/TreehouseRenderer'
import { TreehouseEditor } from '@/components/treehouse/TreehouseEditor'

type Props = {
  config: TreehouseConfig
  data: TreehouseData
}

function TreehouseShellInner({ config, data }: Props) {
  const searchParams = useSearchParams()
  const isEditing = searchParams?.get('edit') === 'true' && data.isOwnProfile

  if (isEditing) {
    return <TreehouseEditor initialConfig={config} data={data} />
  }

  return <TreehouseRenderer config={config} data={data} />
}

export function TreehouseShell(props: Props) {
  return (
    <Suspense fallback={<TreehouseRenderer {...props} />}>
      <TreehouseShellInner {...props} />
    </Suspense>
  )
}
