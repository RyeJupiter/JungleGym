import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, formatDuration, calculatePriceBreakdown } from '@junglegym/shared'
import type { Database, PriceTier } from '@junglegym/shared'

type Video = Database['public']['Tables']['videos']['Row']

const TIERS: { key: PriceTier; label: string; desc: string }[] = [
  { key: 'supported', label: 'Supported', desc: 'Pay what you can' },
  { key: 'community', label: 'Community', desc: 'Chip in a little more' },
  { key: 'abundance', label: 'Abundance', desc: "You're thriving" },
]

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [video, setVideo] = useState<Video | null>(null)
  const [purchase, setPurchase] = useState<{ tier: string } | null>(null)
  const [selectedTier, setSelectedTier] = useState<PriceTier>('community')
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('videos').select('*').eq('id', id).single()
      .then(({ data }) => setVideo(data))
    if (user) {
      supabase.from('purchases').select('tier').eq('user_id', user.id).eq('video_id', id).maybeSingle()
        .then(({ data }) => setPurchase(data))
    }
  }, [id, user])

  const hasAccess = video?.is_free || !!purchase

  const prices: Record<PriceTier, number | null> = {
    supported: video?.price_supported ?? null,
    community: video?.price_community ?? null,
    abundance: video?.price_abundance ?? null,
  }

  const selectedPrice = prices[selectedTier] ?? 0
  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(selectedPrice)

  async function buy() {
    if (!user) { router.push('/(auth)/login'); return }
    if (!selectedPrice || !video) return
    setBuying(true)
    const { error } = await supabase.from('purchases').insert({
      user_id: user.id,
      video_id: video.id,
      tier: selectedTier,
      amount_paid: creatorAmount,
      platform_tip_pct: 20,
      platform_amount: platformFee,
      total_amount: total,
    })
    setBuying(false)
    if (error) Alert.alert('Error', error.message)
    else setPurchase({ tier: selectedTier })
  }

  if (!video) return <View style={styles.loading}><Text>Loading...</Text></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.player}>
        {hasAccess ? (
          <Text style={styles.playerIcon}>▶</Text>
        ) : (
          <Text style={styles.playerIcon}>🔒</Text>
        )}
        <Text style={styles.playerText}>
          {hasAccess ? 'Ready to watch' : 'Choose a tier to unlock'}
        </Text>
      </View>

      <Text style={styles.title}>{video.title}</Text>
      {video.duration_seconds && (
        <Text style={styles.duration}>{formatDuration(video.duration_seconds)}</Text>
      )}
      {video.description && <Text style={styles.desc}>{video.description}</Text>}

      {!hasAccess && !video.is_free && (
        <View style={styles.tiers}>
          {/* Tier picker */}
          {TIERS.map(({ key, label, desc }) => {
            const price = prices[key]
            if (!price) return null
            return (
              <TouchableOpacity key={key} style={[styles.tier, selectedTier === key && styles.tierActive]}
                onPress={() => setSelectedTier(key)}>
                <View>
                  <Text style={styles.tierLabel}>{label}</Text>
                  <Text style={styles.tierDesc}>{desc}</Text>
                </View>
                <Text style={styles.tierPrice}>{formatPrice(price)}</Text>
              </TouchableOpacity>
            )
          })}

          {/* Receipt breakdown */}
          {selectedPrice > 0 && (
            <View style={styles.receipt}>
              <View style={[styles.receiptRow, styles.receiptTotal]}>
                <Text style={styles.receiptTotalLabel}>Total</Text>
                <Text style={styles.receiptTotalValue}>{formatPrice(total)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>To creator (80%)</Text>
                <Text style={styles.receiptValue}>{formatPrice(creatorAmount)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabelSub}>Platform fee (20%)</Text>
                <Text style={styles.receiptValueSub}>{formatPrice(platformFee)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.buyBtn, buying && styles.buyBtnDisabled]}
            onPress={buy} disabled={buying}>
            <Text style={styles.buyBtnText}>{buying ? 'Processing...' : 'Unlock video'}</Text>
          </TouchableOpacity>
          <Text style={styles.creatorNote}>80% goes to the creator. 20% platform fee.</Text>
        </View>
      )}

      {hasAccess && (
        <View style={styles.accessBadge}>
          <Text style={styles.accessText}>
            {video.is_free ? 'Free video' : `Unlocked · ${purchase?.tier}`}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 20 },
  player: { backgroundColor: '#1c1917', borderRadius: 14, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  playerIcon: { fontSize: 40, color: '#fff', marginBottom: 8 },
  playerText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '800', color: '#1c1917', marginBottom: 4 },
  duration: { fontSize: 13, color: '#78716c', marginBottom: 8 },
  desc: { fontSize: 14, color: '#57534e', lineHeight: 22, marginBottom: 20 },
  tiers: { gap: 10 },
  tier: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#e7e5e4' },
  tierActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  tierLabel: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
  tierDesc: { fontSize: 12, color: '#78716c' },
  tierPrice: { fontSize: 18, fontWeight: '800', color: '#1c1917' },
  tipBox: { backgroundColor: '#f5f5f4', borderRadius: 12, padding: 14, gap: 10 },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipTitle: { fontSize: 12, fontWeight: '700', color: '#57534e', textTransform: 'uppercase', letterSpacing: 0.5 },
  tipSubtitle: { fontSize: 11, color: '#a8a29e' },
  tipPresets: { flexDirection: 'row', gap: 6 },
  tipBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#d6d3d1', backgroundColor: '#fff', alignItems: 'center' },
  tipBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  tipBtnText: { fontSize: 12, fontWeight: '700', color: '#57534e' },
  tipBtnTextActive: { color: '#fff' },
  receipt: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bbf7d0', gap: 6 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: 14, color: '#374151' },
  receiptValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  receiptLabelSub: { fontSize: 12, color: '#6b7280' },
  receiptValueSub: { fontSize: 12, color: '#6b7280' },
  receiptTotal: { borderTopWidth: 1, borderTopColor: '#bbf7d0', paddingTop: 6, marginTop: 2 },
  receiptTotalLabel: { fontSize: 15, fontWeight: '800', color: '#1c1917' },
  receiptTotalValue: { fontSize: 15, fontWeight: '800', color: '#1c1917' },
  buyBtn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  creatorNote: { fontSize: 11, color: '#a8a29e', textAlign: 'center' },
  accessBadge: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  accessText: { color: '#15803d', fontWeight: '700', fontSize: 15 },
})
