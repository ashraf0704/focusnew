import {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {Stack, router, useRootNavigationState} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider as PaperProvider, MD3LightTheme} from 'react-native-paper';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Colors} from '@/constants/colors';
import {JWT_KEY, endpoints} from '@/lib/apiClient';
import {useAuthStore} from '@/store/authStore';
import {useAppStore} from '@/store/appStore';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
const queryClient = new QueryClient();

const theme = {
  ...MD3LightTheme,
  colors: {...MD3LightTheme.colors, primary: Colors.primary, secondary: Colors.vibrant, background: Colors.bg},
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setProfile = useAuthStore(state => state.setProfile);
  const hydrate = useAppStore(state => state.hydrate);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    async function boot() {
      const jwt = await SecureStore.getItemAsync(JWT_KEY);
      if (!jwt) {
        router.replace('/(auth)/welcome');
        setReady(true);
        await SplashScreen.hideAsync();
        return;
      }
      try {
        const payload = await endpoints.boot();
        setProfile(payload.profile);
        hydrate(payload);
        router.replace('/(app)');
      } catch {
        await SecureStore.deleteItemAsync(JWT_KEY);
        router.replace('/(auth)/welcome');
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    boot();
  }, [rootNavigationState?.key, hydrate, setProfile]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
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
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12},
  logo: {fontSize: 28, fontWeight: '900', color: Colors.primary},
});
