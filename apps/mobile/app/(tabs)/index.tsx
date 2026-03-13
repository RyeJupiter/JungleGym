import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, formatDuration } from '@junglegym/shared'
import type { Database } from '@junglegym/shared'

type Video = Database['public']['Tables']['videos']['Row']

export default function ExploreScreen() {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const TAGS = ['yoga', 'strength', 'mobility', 'hiit', 'kettlebell', 'breathwork']

  useEffect(() => {
    let query = supabase
      .from('videos')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20)
    if (selectedTag) query = query.contains('tags', [selectedTag])
    query.then(({ data }) => setVideos(data ?? []))
  }, [selectedTag])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Explore</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
        <TouchableOpacity
          style={[styles.tag, !selectedTag && styles.tagActive]}
          onPress={() => setSelectedTag(null)}>
          <Text style={[styles.tagText, !selectedTag && styles.tagTextActive]}>All</Text>
        </TouchableOpacity>
        {TAGS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tag, selectedTag === t && styles.tagActive]}
            onPress={() => setSelectedTag(t)}>
            <Text style={[styles.tagText, selectedTag === t && styles.tagTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {videos.map((video) => (
        <TouchableOpacity key={video.id} style={styles.card}
          onPress={() => router.push(`/video/${video.id}`)}>
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailIcon}>🌿</Text>
            {video.is_free && (
              <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>Free</Text></View>
            )}
            {video.duration_seconds && (
              <View style={styles.durBadge}>
                <Text style={styles.durText}>{formatDuration(video.duration_seconds)}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{video.title}</Text>
            {!video.is_free && video.price_supported && (
              <Text style={styles.cardPrice}>from {formatPrice(video.price_supported)}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '900', color: '#1c1917', marginBottom: 16 },
  tagScroll: { marginBottom: 20, flexDirection: 'row' },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f5f5f4', marginRight: 8 },
  tagActive: { backgroundColor: '#16a34a' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#57534e', textTransform: 'capitalize' },
  tagTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e7e5e4' },
  thumbnail: { height: 160, backgroundColor: '#d6d3d1', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  thumbnailIcon: { fontSize: 40 },
  freeBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#16a34a', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  durBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  durText: { color: '#fff', fontSize: 11 },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginBottom: 3 },
  cardPrice: { fontSize: 12, color: '#78716c' },
})
