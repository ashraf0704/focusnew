import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {PriorityTag} from '@/components/ui/PriorityTag';
import {Colors} from '@/constants/colors';
import {Task} from '@/types';

export function TaskList({tasks, onToggle, onDelete}: {tasks: Task[]; onToggle: (id: string) => void; onDelete: (id: string) => void}) {
  const ordered = [...tasks].sort((a, b) => ({high: 0, medium: 1, low: 2}[a.priority] - {high: 0, medium: 1, low: 2}[b.priority]));
  return (
    <FlatList
      data={ordered}
      keyExtractor={item => item.id}
      scrollEnabled={false}
      renderItem={({item}) => (
        <Pressable onPress={() => onToggle(item.id)} onLongPress={() => onDelete(item.id)} style={styles.item}>
          <Text style={[styles.check, item.completed && styles.done]}>{item.completed ? '✓' : ''}</Text>
          <View style={{flex: 1}}>
            <Text style={[styles.title, item.completed && styles.struck]}>{item.title}</Text>
            <Text style={styles.date}>{item.dueDate}</Text>
          </View>
          <PriorityTag priority={item.priority} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.softBorder},
  check: {width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: Colors.softBorder, textAlign: 'center', color: Colors.white, backgroundColor: Colors.white},
  done: {backgroundColor: Colors.success, borderColor: Colors.success},
  title: {fontWeight: '800', color: Colors.dark},
  struck: {textDecorationLine: 'line-through', color: Colors.muted},
  date: {fontSize: 11, color: Colors.muted, marginTop: 2},
});
