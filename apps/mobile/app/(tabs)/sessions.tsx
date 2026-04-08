import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { calculatePriceBreakdown, formatPrice } from '@junglegym/shared'
import type { Database } from '@junglegym/shared'

type LiveSession = Database['public']['Tables']['live_sessions']['Row']

export default function SessionsScreen() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [giftModal, setGiftModal] = useState<{ sessionId: string; creatorName: string } | null>(null)
  const [giftAmount, setGiftAmount] = useState('')
  const [sendingGift, setSendingGift] = useState(false)

  useEffect(() => {
    supabase
      .from('live_sessions')
      .select('*, profiles!creator_id(display_name, username)')
      .in('status', ['scheduled', 'live'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => setSessions((data as LiveSession[]) ?? []))
  }, [])

  const rawAmount = parseFloat(giftAmount) || 0
  const { creatorAmount, platformFee, total } = calculatePriceBreakdown(rawAmount)

  async function sendGift() {
    if (!giftModal || !user || rawAmount <= 0) return
    setSendingGift(true)
    const { error } = await supabase.from('gifts').insert({
      session_id: giftModal.sessionId,
      giver_id: user.id,
      creator_amount: creatorAmount,
      platform_tip_pct: 20,
      platform_amount: platformFee,
      total_amount: total,
    })
    setSendingGift(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setGiftModal(null)
      setGiftAmount('')
      Alert.alert('💚 Gift sent!', 'Thank you for your generosity.')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Live Sessions</Text>
      <Text style={styles.sub}>Gift-based. 100% of your gift goes to the creator.</Text>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyText}>No sessions scheduled right now.</Text>
        </View>
      ) : (
        sessions.map((s) => {
          const creator = (s as any).profiles
          const isLive = s.status === 'live'
          return (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {isLive && <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>}
                <Text style={styles.cardTitle}>{s.title}</Text>
              </View>
              <Text style={styles.creatorName}>{creator?.display_name}</Text>
              <Text style={styles.dateText}>
                {new Date(s.scheduled_at).toLocaleString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })} · {s.duration_minutes} min
              </Text>
              {isLive && user && (
                <TouchableOpacity style={styles.giftBtn}
                  onPress={() => setGiftModal({ sessionId: s.id, creatorName: creator?.display_name ?? '' })}>
                  <Text style={styles.giftBtnText}>🎁 Send a gift</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })
      )}

      {/* Gift modal */}
      <Modal visible={!!giftModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Send a gift</Text>
            <Text style={styles.modalSub}>
              80% goes to {giftModal?.creatorName}. 20% platform fee.
            </Text>

            <Text style={styles.label}>Gift amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollar}>$</Text>
              <TextInput style={styles.amountInput} keyboardType="decimal-pad"
                value={giftAmount} onChangeText={setGiftAmount} placeholder="20" placeholderTextColor="#9ca3af" />
            </View>

            {rawAmount > 0 && (
              <View style={styles.summary}>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryBold}>Total</Text>
                  <Text style={styles.summaryBold}>{formatPrice(total)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>To creator (80%)</Text>
                  <Text style={styles.summaryValue}>{formatPrice(creatorAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Platform fee (20%)</Text>
                  <Text style={styles.summaryMuted}>{formatPrice(platformFee)}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGiftModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sendBtn, (sendingGift || rawAmount <= 0) && styles.sendBtnDisabled]}
                onPress={sendGift} disabled={sendingGift || rawAmount <= 0}>
                <Text style={styles.sendText}>{sendingGift ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '900', color: '#1c1917', marginBottom: 4 },
  sub: { fontSize: 13, color: '#78716c', marginBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#a8a29e', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e7e5e4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  liveBadge: { backgroundColor: '#ef4444', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1c1917', flex: 1 },
  creatorName: { fontSize: 13, color: '#15803d', fontWeight: '600', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#78716c' },
  giftBtn: { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  giftBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1c1917', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#78716c', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#44403c', marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  dollar: { fontSize: 16, color: '#9ca3af', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1c1917', paddingVertical: 10 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tipBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f5f5f4', alignItems: 'center' },
  tipBtnActive: { backgroundColor: '#16a34a' },
  tipText: { fontSize: 12, fontWeight: '600', color: '#57534e' },
  tipTextActive: { color: '#fff' },
  summary: { backgroundColor: '#f5f5f4', borderRadius: 12, padding: 12, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#78716c' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#15803d' },
  summaryMuted: { fontSize: 13, color: '#a8a29e' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#e7e5e4', paddingTop: 8, marginTop: 4 },
  summaryBold: { fontSize: 15, fontWeight: '800', color: '#1c1917' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#f5f5f4', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#57534e' },
  sendBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { fontWeight: '700', color: '#fff' },
})
