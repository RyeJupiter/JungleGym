'use client'

import { useState, useCallback, useRef } from 'react'
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
import { compressImage } from '@/lib/compressImage'
import type { TreehouseConfig, SectionConfig, ThemeKey } from './config'
import { SINGLETON_SECTIONS } from './config'
import { THEME_MAP, withBannerOverrides } from './themes'
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
  const profileEditsRef = useRef<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const baseTheme = THEME_MAP[config.theme]
  const theme = config.banner ? withBannerOverrides(baseTheme) : baseTheme

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

  // ── Banner ──
  const handleBannerChange = useCallback((url: string | null) => {
    setConfig((prev) => ({ ...prev, banner: url }))
  }, [])

  const handleBannerUpload = useCallback(async (file: File): Promise<string> => {
    const supabase = createBrowserSupabaseClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${data.profile.user_id}/banner.${ext}`
    const { error } = await supabase.storage
      .from('profile-banners')
      .upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('profile-banners').getPublicUrl(path)
    return publicUrl
  }, [data.profile.user_id])

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
    profileEditsRef.current = { ...profileEditsRef.current, [field]: value }
    setProfileEdits(profileEditsRef.current)
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
      // Read from ref to capture any pending onBlur edits that haven't committed to state yet
      const edits = profileEditsRef.current
      const updatePayload: Record<string, unknown> = {
        treehouse_config: config,
      }

      // Banner is stored inside treehouse_config (already included above via `config`)
      // Include any inline text edits
      if (edits.display_name !== undefined) updatePayload.display_name = edits.display_name
      if (edits.tagline !== undefined) updatePayload.tagline = edits.tagline || null
      if (edits.bio !== undefined) updatePayload.bio = edits.bio || null
      if (edits.location !== undefined) updatePayload.location = edits.location || null
      if (edits.instagram_url !== undefined) updatePayload.instagram_url = edits.instagram_url || null
      if (edits.website_url !== undefined) updatePayload.website_url = edits.website_url || null
      if (edits.tags !== undefined) {
        updatePayload.tags = edits.tags
          ? edits.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : []
      }
      if (edits.supported_rate !== undefined) {
        const r = parseFloat(edits.supported_rate)
        if (!isNaN(r) && r > 0) updatePayload.supported_rate = r
      }
      if (edits.community_rate !== undefined) {
        const r = parseFloat(edits.community_rate)
        if (!isNaN(r) && r > 0) updatePayload.community_rate = r
      }
      if (edits.abundance_rate !== undefined) {
        const r = parseFloat(edits.abundance_rate)
        if (!isNaN(r) && r > 0) updatePayload.abundance_rate = r
      }

      // Upload photo if changed
      if (edits.photo_url !== undefined) {
        if (photoFile) {
          const ready = await compressImage(photoFile, { maxWidth: 1000, maxHeight: 1000, maxBytes: 5 * 1024 * 1024 })
          const ext = ready.name.split('.').pop()
          const path = `${data.profile.user_id}/avatar.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(path, ready, { cacheControl: '3600', upsert: true })
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)
          // Append cache-bust param — CDN caches the old file at the same path
          // for up to cacheControl seconds, so the URL must differ per upload.
          updatePayload.photo_url = `${publicUrl}?v=${Date.now()}`
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
      ...(profileEdits.location !== undefined ? { location: profileEdits.location || null } : {}),
      ...(profileEdits.instagram_url !== undefined ? { instagram_url: profileEdits.instagram_url || null } : {}),
      ...(profileEdits.website_url !== undefined ? { website_url: profileEdits.website_url || null } : {}),
      ...(profileEdits.tags !== undefined ? {
        tags: profileEdits.tags
          ? profileEdits.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : []
      } : {}),
      ...(profileEdits.supported_rate !== undefined ? { supported_rate: parseFloat(profileEdits.supported_rate) || data.profile.supported_rate } : {}),
      ...(profileEdits.community_rate !== undefined ? { community_rate: parseFloat(profileEdits.community_rate) || data.profile.community_rate } : {}),
      ...(profileEdits.abundance_rate !== undefined ? { abundance_rate: parseFloat(profileEdits.abundance_rate) || data.profile.abundance_rate } : {}),
    },
  }

  return (
    <div className={`relative min-h-screen ${theme.pageBg}`}>
      {/* Full-page banner background */}
      {config.banner && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.banner})` }}
        >
          <div className="absolute inset-0 bg-black/65" />
        </div>
      )}
      <div className="relative z-10">
      <EditorToolbar
        config={config}
        onThemeChange={(t: ThemeKey) => setConfig((prev) => ({ ...prev, theme: t }))}
        onTemplateApply={(t: TreehouseConfig) => setConfig(t)}
        onBannerChange={handleBannerChange}
        onBannerUpload={handleBannerUpload}
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
                  hasBanner={!!config.banner}
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
      </div>  {/* end relative z-10 */}
    </div>
  )
}
