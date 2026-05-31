import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {Subject} from '@/types';

export function SubjectChip({subject, selected, onPress}: {subject: Subject; selected?: boolean; onPress?: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <View style={[styles.dot, {backgroundColor: subject.accentColor || Colors.vibrant}]} />
      <Text style={styles.name}>{subject.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {minWidth: 140, borderRadius: 16, padding: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, marginRight: 10},
  selected: {borderColor: Colors.vibrant, backgroundColor: '#FFF7EA'},
  dot: {width: 10, height: 10, borderRadius: 999, marginBottom: 10},
  name: {fontWeight: '900', color: Colors.dark},
});
