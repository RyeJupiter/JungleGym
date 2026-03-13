import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native'
import { Link, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@junglegym/shared'

export default function SignupScreen() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('learner')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName, role } },
    })
    if (error) {
      Alert.alert('Signup failed', error.message)
    } else if (data.user) {
      await supabase.from('users').insert({ id: data.user.id, email, role })
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        display_name: displayName,
        username: username.toLowerCase(),
        tags: [],
      })
      router.replace('/(tabs)')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>jungle<Text style={styles.logoAccent}>gym</Text></Text>
        <Text style={styles.title}>Join the community</Text>

        <View style={styles.roleRow}>
          {(['learner', 'creator'] as UserRole[]).map((r) => (
            <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}>
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                {r === 'creator' ? "I'm a creator" : "I'm a learner"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Display name" placeholderTextColor="#9ca3af"
          value={displayName} onChangeText={setDisplayName} />
        <TextInput style={styles.input} placeholder="@username" placeholderTextColor="#9ca3af"
          value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password (8+)" placeholderTextColor="#9ca3af"
          value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create account'}</Text>
        </TouchableOpacity>
        <Link href="/(auth)/login" style={styles.link}>
          Already here? <Text style={styles.linkBold}>Sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo: { fontSize: 28, fontWeight: '900', color: '#3d7a4f', textAlign: 'center', marginBottom: 4 },
  logoAccent: { color: '#22c55e' },
  title: { fontSize: 24, fontWeight: '800', color: '#1c1917', textAlign: 'center', marginBottom: 24 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#e7e5e4', alignItems: 'center', backgroundColor: '#fff' },
  roleBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  roleText: { fontWeight: '600', color: '#1c1917', fontSize: 13 },
  roleTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1c1917', marginBottom: 12 },
  btn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 18 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { textAlign: 'center', color: '#57534e', fontSize: 13 },
  linkBold: { fontWeight: '700', color: '#15803d' },
})
