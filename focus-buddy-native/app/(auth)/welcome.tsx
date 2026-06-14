import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Button, TextInput } from 'react-native-paper';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function WelcomeScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dailyGoal, setDailyGoal] = useState('25');
  const [loading, setLoading] = useState(false);
  const scale = useSharedValue(1);
  const setJwt = useAuthStore(state => state.setJwt);
  const setProfile = useAuthStore(state => state.setProfile);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.1, { duration: 900 }), -1, true);
  }, []);

  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // ── MOCK LOGIN ──────────────────────────────────────────────────────────────
  // The backend server is not reachable in this preview build.
  // All sign-in / sign-up / guest flows use a local mock profile so that the
  // app can be fully demonstrated without a live server.
  async function signInWithMock(name?: string) {
    setLoading(true);
    await setJwt('mock-jwt-preview');
    setProfile({
      id: 'mock-001',
      fullName: name || fullName || 'Demo User',
      email: email || 'demo@focusbuddy.app',
      dailyGoal: Number(dailyGoal) || 25,
    } as any);
    router.replace('/(app)');
    setLoading(false);
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.bg]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.card}>
        <Animated.Text style={[styles.eye, pulse]}>◉</Animated.Text>
        <Text style={styles.title}>Focus Buddy</Text>
        <Text style={styles.copy}>Native study sessions, vaults, AI help, and rewards.</Text>

        {mode === 'signup' && (
          <TextInput
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        )}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        {mode === 'signup' && (
          <TextInput
            placeholder="Daily goal (minutes)"
            value={dailyGoal}
            onChangeText={setDailyGoal}
            keyboardType="number-pad"
            style={styles.input}
          />
        )}

        <Button onPress={() => signInWithMock()} disabled={loading} mode="contained">
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </Button>

        <Button mode="text" onPress={() => signInWithMock('Guest')} disabled={loading}>
          Continue as Guest
        </Button>

        <Button mode="text" onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'I already have an account' : 'Create a new account'}
        </Button>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 28, padding: 22, gap: 12 },
  eye: { fontSize: 44, color: Colors.vibrant, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: Colors.primary, textAlign: 'center' },
  copy: { color: Colors.muted, textAlign: 'center', marginBottom: 8 },
  input: { backgroundColor: Colors.white, borderColor: Colors.softBorder, borderWidth: 1, borderRadius: 14, padding: 13 },
});
