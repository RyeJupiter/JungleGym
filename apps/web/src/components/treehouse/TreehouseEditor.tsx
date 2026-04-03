'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { TreehouseConfig, SectionConfig, ThemeKey } from './config'
import { SINGLETON_SECTIONS } from './config'
import { THEME_MAP } from './themes'
import { SectionRenderer } from './sections/SectionRenderer'
import type { TreehouseData } from './sections/SectionRenderer'
import { SortableSection } from './SortableSection'
import { EditorToolbar } from './EditorToolbar'
import { AddSectionMenu } from './AddSectionMenu'

type Props = {
  initialConfig: TreehouseConfig
  data: TreehouseData
}

export function TreehouseEditor({ initialConfig, data }: Props) {
  const router = useRouter()
  const [config, setConfig] = useState<TreehouseConfig>(initialConfig)
  const [profileEdits, setProfileEdits] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const theme = THEME_MAP[config.theme]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── DnD handler ──
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setConfig((prev) => {
      const oldIdx = prev.sections.findIndex((s) => s.id === active.id)
      const newIdx = prev.sections.findIndex((s) => s.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      return { ...prev, sections: arrayMove(prev.sections, oldIdx, newIdx) }
    })
  }

  // ── Section mutations ──
  function updateSection(id: string, update: Partial<SectionConfig>) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...update } : s)),
    }))
  }

  function removeSection(id: string) {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }))
  }

  function addSection(section: SectionConfig) {
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, section],
    }))
  }

  // ── Profile field edits ──
  const handleFieldChange = useCallback((field: string, value: string) => {
    setProfileEdits((prev) => ({ ...prev, [field]: value }))
  }, [])

  // ── Photo change ──
  const handlePhotoChange = useCallback((file: File | null, previewUrl: string | null) => {
    setPhotoFile(file)
    setProfileEdits((prev) => ({ ...prev, photo_url: previewUrl ?? '' }))
  }, [])

  // ── Section data edits ──
  const handleSectionDataChange = useCallback((sectionId: string, newData: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, data: { ...(s.data ?? {}), ...newData } } : s
      ),
    }))
  }, [])

  // ── Save ──
  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const updatePayload: Record<string, unknown> = {
        treehouse_config: config,
      }

      // Include any inline text edits
      if (profileEdits.display_name !== undefined) updatePayload.display_name = profileEdits.display_name
      if (profileEdits.tagline !== undefined) updatePayload.tagline = profileEdits.tagline || null
      if (profileEdits.bio !== undefined) updatePayload.bio = profileEdits.bio || null

      // Upload photo if changed
      if (profileEdits.photo_url !== undefined) {
        if (photoFile) {
          const ext = photoFile.name.split('.').pop()
          const path = `${data.profile.user_id}/avatar.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(path, photoFile, { cacheControl: '3600', upsert: true })
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)
          updatePayload.photo_url = publicUrl
        } else {
          // photo was removed
          updatePayload.photo_url = null
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('profiles') as any)
        .update(updatePayload)
        .eq('user_id', data.profile.user_id)

      if (error) throw error

      router.push(`/@${data.profile.username}`)
      router.refresh()
    } catch (err) {
      alert('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    router.push(`/@${data.profile.username}`)
  }

  // Build a "live" profile merging edits for display
  const liveData: TreehouseData = {
    ...data,
    profile: {
      ...data.profile,
      ...(profileEdits.display_name !== undefined ? { display_name: profileEdits.display_name } : {}),
      ...(profileEdits.tagline !== undefined ? { tagline: profileEdits.tagline || null } : {}),
      ...(profileEdits.bio !== undefined ? { bio: profileEdits.bio || null } : {}),
      ...(profileEdits.photo_url !== undefined ? { photo_url: profileEdits.photo_url || null } : {}),
    },
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <EditorToolbar
        config={config}
        onThemeChange={(t: ThemeKey) => setConfig((prev) => ({ ...prev, theme: t }))}
        onTemplateApply={(t: TreehouseConfig) => setConfig(t)}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={config.sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {config.sections.map((section) => {
            const isSingleton = SINGLETON_SECTIONS.includes(section.type)
            return (
              <SortableSection
                key={section.id}
                section={section}
                onToggleVisibility={() =>
                  updateSection(section.id, { visible: !section.visible })
                }
                onVariantChange={
                  section.type === 'hero'
                    ? (v) => updateSection(section.id, { variant: v })
                    : undefined
                }
                onRemove={!isSingleton ? () => removeSection(section.id) : undefined}
                canRemove={!isSingleton}
              >
                <SectionRenderer
                  section={section}
                  data={liveData}
                  theme={theme}
                  editing
                  onFieldChange={handleFieldChange}
                  onSectionDataChange={handleSectionDataChange}
                  onPhotoChange={handlePhotoChange}
                />
              </SortableSection>
            )
          })}
        </SortableContext>
      </DndContext>

      <AddSectionMenu
        currentSections={config.sections}
        onAdd={addSection}
      />
    </div>
  )
}
