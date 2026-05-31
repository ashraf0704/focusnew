import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';

export function StatsBar({minutes, goal, streak, points}: {minutes: number; goal: number; streak: number; points: number}) {
  const pct = Math.min(1, minutes / Math.max(1, goal));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.title}>Daily progress</Text>
        <Text style={styles.meta}>{minutes}/{goal} min</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, {width: `${pct * 100}%`}]} /></View>
      <View style={styles.row}>
        <Text style={styles.meta}>Flame streak: {streak} days</Text>
        <Text style={styles.meta}>{points} pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {backgroundColor: Colors.primary, borderRadius: 20, padding: 16, gap: 10},
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  title: {color: Colors.white, fontSize: 16, fontWeight: '900'},
  meta: {color: Colors.bg, fontSize: 12, fontWeight: '700'},
  track: {height: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, overflow: 'hidden'},
  fill: {height: 10, backgroundColor: Colors.vibrant},
});
