import {Pressable, StyleSheet, Text} from 'react-native';
import {Tabs, router} from 'expo-router';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {Colors} from '@/constants/colors';

const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  index: 'view-dashboard',
  timer: 'timer',
  decks: 'cards',
  insights: 'chart-bar',
  vault: 'folder',
  settings: 'cog',
};

export default function AppTabs() {
  return (
    <>
      <Tabs
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarStyle: {backgroundColor: Colors.primary, borderTopWidth: 0, height: 70, paddingBottom: 10},
          tabBarActiveTintColor: Colors.vibrant,
          tabBarInactiveTintColor: 'rgba(254,250,224,0.55)',
          tabBarIcon: ({color, size}) => <MaterialCommunityIcons name={icons[route.name] || 'circle'} color={color} size={size} />,
        })}
      >
        <Tabs.Screen name="index" options={{title: 'Dashboard'}} />
        <Tabs.Screen name="timer" options={{title: 'Timer'}} />
        <Tabs.Screen name="decks" options={{title: 'Decks'}} />
        <Tabs.Screen name="insights" options={{title: 'Insights'}} />
        <Tabs.Screen name="vault" options={{title: 'Vault'}} />
        <Tabs.Screen name="settings" options={{title: 'Settings'}} />
      </Tabs>
      <Pressable onPress={() => router.push('/ai-doubt-solver')} style={styles.fab}>
        <Text style={styles.fabText}>AI</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {position: 'absolute', right: 18, bottom: 86, width: 58, height: 58, borderRadius: 18, backgroundColor: Colors.vibrant, alignItems: 'center', justifyContent: 'center', elevation: 8},
  fabText: {color: Colors.white, fontWeight: '900'},
});
