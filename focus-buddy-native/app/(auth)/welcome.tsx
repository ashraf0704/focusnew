import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {router} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {Button} from 'react-native-paper';
import {Colors} from '@/constants/colors';

export default function WelcomeScreen() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.12, {duration: 950}), -1, true);
  }, [scale]);

  const pulse = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.bg]}
      style={styles.screen}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <View style={styles.hero}>
        <Animated.Text style={[styles.eye, pulse]}>◉</Animated.Text>
        <Text style={styles.title}>Focus Buddy</Text>
        <Text style={styles.tagline}>
          Native study sessions, vaults, AI help, and rewards.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get started</Text>
        <Text style={styles.cardSub}>
          Your progress stays safely on this device — no server required.
        </Text>

        <Button
          id="welcome-signup-btn"
          mode="contained"
          onPress={() => router.push('/(auth)/signup' as any)}
          style={styles.btnPrimary}
          labelStyle={styles.btnLabel}
          contentStyle={styles.btnContent}>
          Create an Account
        </Button>

        <Button
          id="welcome-login-btn"
          mode="outlined"
          onPress={() => router.push('/(auth)/login' as any)}
          style={styles.btnOutline}
          labelStyle={styles.btnLabelOutline}
          contentStyle={styles.btnContent}>
          Sign In
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, justifyContent: 'space-between', padding: 28},
  hero: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14},
  eye: {fontSize: 72, color: Colors.vibrant},
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 260,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 26,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
    textAlign: 'center',
  },
  cardSub: {
    color: Colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  btnOutline: {
    borderRadius: 14,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  btnContent: {paddingVertical: 6},
  btnLabel: {color: Colors.white, fontWeight: '700', fontSize: 15},
  btnLabelOutline: {color: Colors.primary, fontWeight: '700', fontSize: 15},
});
