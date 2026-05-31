import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';
import {StudySessionLog} from '@/types';

export function SessionHistory({logs}: {logs: StudySessionLog[]}) {
  return (
    <View>
      {logs.slice(0, 8).map(log => (
        <View key={log.id} style={styles.item}>
          <Text style={styles.title}>{log.durationMinutes} min {log.mode}</Text>
          <Text style={styles.date}>{new Date(log.timestamp).toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.softBorder},
  title: {fontWeight: '800', color: Colors.dark},
  date: {fontSize: 11, color: Colors.muted},
});
