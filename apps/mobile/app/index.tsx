import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '@/context/AuthContext'

export default function IndexScreen() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#14532d' }}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    )
  }

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />
}
