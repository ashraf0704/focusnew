import {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {Stack, router, useRootNavigationState} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider as PaperProvider, MD3LightTheme} from 'react-native-paper';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Colors} from '@/constants/colors';
import {AuthProvider, useAuth} from '@/auth/AuthContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
const queryClient = new QueryClient();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.vibrant,
    background: Colors.bg,
  },
};

// ── Inner component that reads auth state and routes ─────────────────────────

function RootNavigator() {
  const {user, loading} = useAuth();
  const [ready, setReady] = useState(false);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (loading) return; // Wait until AuthContext resolves the session

    async function boot() {
      try {
        if (!user) {
          router.replace('/(auth)/welcome');
        } else {
          router.replace('/(app)');
        }
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    boot();
  }, [rootNavigationState?.key, user, loading]);

  return (
    <>
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="focus-session" options={{presentation: 'modal'}} />
        <Stack.Screen name="ai-doubt-solver" options={{presentation: 'modal'}} />
        <Stack.Screen name="ai-focus-monitor" options={{presentation: 'modal'}} />
      </Stack>
      {!ready && (
        <View style={[StyleSheet.absoluteFill, styles.splash]}>
          <ActivityIndicator color={Colors.vibrant} size="large" />
          <Text style={styles.logo}>Focus Buddy</Text>
        </View>
      )}
    </>
  );
}

// ── Root layout wraps everything in providers ────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {fontSize: 28, fontWeight: '900', color: Colors.primary},
});
