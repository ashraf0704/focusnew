import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {router} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import {Button, TextInput} from 'react-native-paper';
import {Colors} from '@/constants/colors';
import {useAuth} from '@/auth/AuthContext';

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const {login} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    const validationError = validate(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await login({email: email.trim(), password});
      // Navigation happens automatically — user state change triggers RootNavigator
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.bg]}
      style={styles.screen}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eye}>◉</Text>
            <Text style={styles.appName}>Focus Buddy</Text>
            <Text style={styles.subtitle}>Welcome back</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <TextInput
              id="login-email"
              label="Email"
              value={email}
              onChangeText={v => {setEmail(v); setError(null);}}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              mode="outlined"
              outlineColor={Colors.softBorder}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              left={<TextInput.Icon icon="email-outline" color={Colors.muted} />}
            />

            {/* Password */}
            <TextInput
              id="login-password"
              label="Password"
              value={password}
              onChangeText={v => {setPassword(v); setError(null);}}
              secureTextEntry={!showPassword}
              mode="outlined"
              outlineColor={Colors.softBorder}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" color={Colors.muted} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={Colors.muted}
                  onPress={() => setShowPassword(p => !p)}
                />
              }
            />

            {/* Submit */}
            <Button
              id="login-submit-btn"
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.btn}
              labelStyle={styles.btnLabel}
              contentStyle={styles.btnContent}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>

            {/* Link to signup */}
            <Pressable
              id="login-go-signup"
              onPress={() => router.replace('/(auth)/signup' as any)}
              style={styles.link}>
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Text style={styles.linkBold}>Sign up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  flex: {flex: 1},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24},
  header: {alignItems: 'center', gap: 6},
  eye: {fontSize: 52, color: Colors.vibrant},
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {color: 'rgba(255,255,255,0.72)', fontSize: 15},
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 26,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
  },
  errorText: {color: Colors.danger, fontSize: 13, lineHeight: 19},
  input: {backgroundColor: Colors.white},
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    marginTop: 4,
  },
  btnContent: {paddingVertical: 6},
  btnLabel: {color: Colors.white, fontWeight: '700', fontSize: 15},
  link: {alignItems: 'center', paddingTop: 4},
  linkText: {color: Colors.muted, fontSize: 14},
  linkBold: {color: Colors.primary, fontWeight: '700'},
});
