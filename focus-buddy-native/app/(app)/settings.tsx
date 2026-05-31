import {Alert, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {router} from 'expo-router';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {BuddyPicker} from '@/components/settings/BuddyPicker';
import {ProfileForm} from '@/components/settings/ProfileForm';
import {SoundSettings} from '@/components/settings/SoundSettings';
import {Colors} from '@/constants/colors';
import {useUpdateProfile} from '@/hooks/useProfile';
import {endpoints} from '@/lib/apiClient';
import {registerForPushNotifications} from '@/lib/notifications';
import {useAuthStore} from '@/store/authStore';

export default function SettingsScreen() {
  const profile = useAuthStore(state => state.profile);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const update = useUpdateProfile();
  if (!profile) return null;

  async function setNotifications(enabled: boolean) {
    try {
      if (!enabled) {
        await endpoints.deletePushSubscription();
        return;
      }
      const token = await registerForPushNotifications();
      if (token) await endpoints.savePushSubscription({expoPushToken: token, platform: 'expo'});
    } catch {
      Alert.alert('Notifications could not be updated.');
    }
  }

  async function signOut() {
    await endpoints.signOut().catch(() => undefined);
    await clearAuth();
    router.replace('/(auth)/welcome');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Card><ProfileForm fullName={profile.fullName} email={profile.email} onNameChange={fullName => update.mutate({fullName})} /></Card>
      <Card><Text style={styles.section}>Focus Buddy</Text><BuddyPicker value={profile.buddySpecies || 'fox'} onChange={buddySpecies => update.mutate({buddySpecies})} /></Card>
      <SoundSettings tone={profile.alarmTone || 'singing-bowl'} volume={profile.soundVolume || 75} onToneChange={alarmTone => update.mutate({alarmTone})} onVolumeChange={soundVolume => update.mutate({soundVolume})} />
      <Card><View style={styles.row}><Text style={styles.section}>Notifications</Text><Switch value={profile.notificationsEnabled} onValueChange={setNotifications} /></View></Card>
      <Button onPress={() => router.push('/ai-focus-monitor')}>Open KameraShield AI Monitor</Button>
      <Button variant="danger" onPress={signOut}>Sign Out</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 18, paddingBottom: 110},
  title: {fontSize: 28, fontWeight: '900', color: Colors.dark},
  section: {fontWeight: '900', color: Colors.dark, marginBottom: 10},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
});
