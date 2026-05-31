import {useEffect, useMemo, useState} from 'react';
import {Alert, AppState, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {activateKeepAwakeAsync, deactivateKeepAwake} from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import {Button} from '@/components/ui/Button';
import {ProgressRing} from '@/components/ui/ProgressRing';
import {Colors} from '@/constants/colors';
import {playAmbientSound, stopAmbientSound} from '@/lib/audioEngine';
import {useFinishSession} from '@/hooks/useSessions';
import {useAppStore} from '@/store/appStore';

function format(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(value => String(value).padStart(2, '0')).join(':');
}

export default function FocusSessionScreen() {
  const params = useLocalSearchParams<{minutes: string; mode: string; sound: string; subjectId: string}>();
  const total = Math.max(1, Number(params.minutes || 25)) * 60;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const [focusScore, setFocusScore] = useState(100);
  const finish = useFinishSession();
  const {subjects, tasks} = useAppStore();
  const subject = subjects.find(item => item.id === params.subjectId);
  const subjectTasks = useMemo(() => tasks.filter(task => task.subjectId === params.subjectId && !task.completed), [params.subjectId, tasks]);

  useEffect(() => {
    activateKeepAwakeAsync();
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    playAmbientSound(params.sound || 'off', 70);
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') setFocusScore(score => Math.max(0, score - 5));
    });
    return () => {
      sub.remove();
      stopAmbientSound();
      deactivateKeepAwake();
      ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, [params.sound]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (remaining === 0) complete(true);
  }, [remaining]);

  async function complete(completed: boolean) {
    await stopAmbientSound();
    const result = await finish.mutateAsync({durationMinutes: Number(params.minutes || 25), subjectId: params.subjectId, mode: params.mode || 'pomodoro', completed, focusScore});
    Alert.alert('Session complete', `You earned ${result.pointsEarned} Buddy Points.`);
    router.replace('/(app)/insights');
  }

  async function togglePause() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPaused(value => !value);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.subject}>{subject?.name || 'Focus Session'}</Text>
      <View style={styles.ring}><ProgressRing progress={(total - remaining) / total} size={230} /><Text style={styles.countdown}>{format(remaining)}</Text></View>
      <Text style={styles.score}>Focus score: {focusScore}%</Text>
      <View style={styles.breathe}><Text style={styles.breatheText}>Inhale • Hold • Exhale</Text></View>
      <View style={styles.row}><Button onPress={togglePause}>{paused ? 'Resume' : 'Pause'}</Button><Button variant="ghost" onPress={() => complete(false)}>Skip</Button><Button variant="danger" onPress={() => router.back()}>Cancel</Button></View>
      <Text style={styles.section}>Session tasks</Text>
      {subjectTasks.map(task => <Text key={task.id} style={styles.task}>□ {task.title}</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.primary},
  content: {padding: 24, alignItems: 'center', gap: 22},
  subject: {fontSize: 26, fontWeight: '900', color: Colors.white},
  ring: {alignItems: 'center', justifyContent: 'center'},
  countdown: {position: 'absolute', color: Colors.white, fontSize: 40, fontWeight: '900'},
  score: {color: Colors.bg, fontWeight: '800'},
  breathe: {width: 160, height: 160, borderRadius: 999, backgroundColor: 'rgba(212,163,115,0.25)', alignItems: 'center', justifyContent: 'center'},
  breatheText: {color: Colors.white, fontWeight: '900'},
  row: {flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center'},
  section: {alignSelf: 'flex-start', color: Colors.vibrant, fontWeight: '900', fontSize: 18},
  task: {alignSelf: 'stretch', color: Colors.bg, padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)'},
});
