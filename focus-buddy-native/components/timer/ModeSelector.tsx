import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {TimerMode} from '@/types';

const modes: Array<{id: TimerMode; label: string}> = [
  {id: 'pomodoro', label: 'Pomodoro'},
  {id: 'short_break', label: 'Short'},
  {id: 'long_break', label: 'Long'},
  {id: 'custom', label: 'Custom'},
];

export function ModeSelector({mode, onChange}: {mode: TimerMode; onChange: (mode: TimerMode) => void}) {
  return (
    <View style={styles.wrap}>
      {modes.map(item => (
        <Pressable key={item.id} onPress={() => onChange(item.id)} style={[styles.tab, item.id === mode && styles.active]}>
          <Text style={[styles.label, item.id === mode && styles.activeText]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flexDirection: 'row', backgroundColor: Colors.softBorder, borderRadius: 16, padding: 4},
  tab: {flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center'},
  active: {backgroundColor: Colors.primary},
  label: {fontWeight: '800', color: Colors.muted, fontSize: 12},
  activeText: {color: Colors.white},
});
