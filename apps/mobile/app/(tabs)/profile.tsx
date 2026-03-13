import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Database } from '@junglegym/shared'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({
    display_name: '', username: '', bio: '', tagline: '', location: '', tags: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data)
          setForm({
            display_name: data.display_name ?? '',
            username: data.username ?? '',
            bio: data.bio ?? '',
            tagline: data.tagline ?? '',
            location: data.location ?? '',
            tags: data.tags?.join(', ') ?? '',
          })
        }
      })
  }, [user])

  async function save() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: form.display_name,
      username: form.username.toLowerCase(),
      bio: form.bio || null,
      tagline: form.tagline || null,
      location: form.location || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Saved', 'Profile updated!')
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>
      {profile?.username && <Text style={styles.username}>@{profile.username}</Text>}

      {[
        { key: 'display_name', label: 'Display name', placeholder: 'Alex Rivera' },
        { key: 'username', label: 'Username', placeholder: 'alexrivera' },
        { key: 'tagline', label: 'Tagline', placeholder: 'Strength & play for every body' },
        { key: 'location', label: 'Location', placeholder: 'Los Angeles, CA' },
        { key: 'tags', label: 'Tags (comma-separated)', placeholder: 'yoga, strength, mobility' },
      ].map(({ key, label, placeholder }) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput style={styles.input} value={form[key as keyof typeof form]}
            onChangeText={(v) => set(key, v)} placeholder={placeholder} placeholderTextColor="#9ca3af" />
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.multiline]} value={form.bio}
          onChangeText={(v) => set('bio', v)} placeholder="Tell people about your practice..."
          placeholderTextColor="#9ca3af" multiline numberOfLines={3} />
      </View>

      <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={save} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save profile'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '900', color: '#1c1917', marginBottom: 2 },
  username: { fontSize: 13, color: '#78716c', marginBottom: 24 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#44403c', marginBottom: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1c1917' },
  multiline: { height: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  signOutBtn: { alignItems: 'center', paddingVertical: 12 },
  signOutText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
})
