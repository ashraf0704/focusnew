import {StyleSheet, Text} from 'react-native';
import {Priority} from '@/types';

export function PriorityTag({priority}: {priority: Priority}) {
  return <Text style={[styles.tag, styles[priority]]}>{priority.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  tag: {fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden'},
  high: {backgroundColor: '#FEE2E2', color: '#991B1B'},
  medium: {backgroundColor: '#FEF3C7', color: '#92400E'},
  low: {backgroundColor: '#DCFCE7', color: '#166534'},
});
