import {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View} from 'react-native';
import {router} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import Animated, {useAnimatedStyle, useSharedValue, withRepeat, withTiming} from 'react-native-reanimated';
import {Button} from '@/components/ui/Button';
import {Colors} from '@/constants/colors';
import {endpoints} from '@/lib/apiClient';
import {useAuthStore} from '@/store/authStore';

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

  scale.value = withRepeat(withTiming(1.1, {duration: 900}), -1, true);
  const pulse = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  async function submit() {
    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await endpoints.signUp({fullName, email, password, dailyGoal: Number(dailyGoal) || 25})
        : await endpoints.signIn({email, password});
      await setJwt(result.jwt);
      setProfile(result.profile);
      router.replace('/(app)');
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Please check your details.');
    } finally {
      setLoading(false);
    }
  }

  async function continueAsGuest() {
    setLoading(true);
    try {
      const result = await endpoints.guestSignIn();
      await setJwt(result.jwt);
      setProfile(result.profile);
      router.replace('/(app)');
    } catch (error) {
      Alert.alert('Guest sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) return Alert.alert('Enter your email first.');
    await endpoints.resetPassword(email);
    Alert.alert('Reset email sent');
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.bg]} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.card}>
        <Animated.Text style={[styles.eye, pulse]}>◉</Animated.Text>
        <Text style={styles.title}>Focus Buddy</Text>
        <Text style={styles.copy}>Native study sessions, vaults, AI help, and rewards.</Text>
        {mode === 'signup' && <TextInput placeholder="Full name" value={fullName} onChangeText={setFullName} style={styles.input} />}
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={styles.input} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        {mode === 'signup' && <TextInput placeholder="Daily goal minutes" value={dailyGoal} onChangeText={setDailyGoal} keyboardType="number-pad" style={styles.input} />}
        <Button onPress={submit} disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</Button>
        <Button variant="ghost" onPress={continueAsGuest} disabled={loading}>Continue as Guest</Button>
        <Button variant="ghost" onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'I already have an account' : 'Create a new account'}
        </Button>
        <Button variant="ghost" onPress={resetPassword}>Forgot Password?</Button>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, justifyContent: 'center', padding: 20},
  card: {backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 28, padding: 22, gap: 12},
  eye: {fontSize: 44, color: Colors.vibrant, alignSelf: 'center'},
  title: {fontSize: 32, fontWeight: '900', color: Colors.primary, textAlign: 'center'},
  copy: {color: Colors.muted, textAlign: 'center', marginBottom: 8},
  input: {backgroundColor: Colors.white, borderColor: Colors.softBorder, borderWidth: 1, borderRadius: 14, padding: 13},
});
