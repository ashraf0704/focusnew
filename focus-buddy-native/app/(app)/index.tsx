import {useState} from 'react';
import {Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {StatsBar} from '@/components/dashboard/StatsBar';
import {SubjectGrid} from '@/components/dashboard/SubjectGrid';
import {TaskList} from '@/components/dashboard/TaskList';
import {Colors} from '@/constants/colors';
import {useAddSubject} from '@/hooks/useSubjects';
import {useAddTask, useDeleteTask, useToggleTask} from '@/hooks/useTasks';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';
import {Priority} from '@/types';

export default function DashboardScreen() {
  const profile = useAuthStore(state => state.profile);
  const {subjects, tasks, selectedSubjectId, setSelectedSubjectId} = useAppStore();
  const addTask = useAddTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const addSubject = useAddSubject();
  const [taskModal, setTaskModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');

  function submitTask() {
    if (!title || !selectedSubjectId) return Alert.alert('Add a title and subject first.');
    addTask.mutate({title, subjectId: selectedSubjectId, priority: 'medium' as Priority, dueDate: new Date().toISOString().slice(0, 10)});
    setTitle('');
    setTaskModal(false);
  }

  function submitSubject() {
    addSubject.mutate({name: subjectName, color: '#EEF2FF', accentColor: Colors.vibrant, iconName: 'book'});
    setSubjectName('');
    setSubjectModal(false);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {profile?.fullName || 'Student'}</Text>
      <StatsBar minutes={profile?.totalFocusMinutes || 0} goal={profile?.dailyGoalMinutes || 25} streak={profile?.streak || 0} points={profile?.buddyPoints || 0} />
      <View style={styles.row}>
        <Text style={styles.section}>Subjects</Text>
        <Button variant="ghost" onPress={() => setSubjectModal(true)}>Add Subject</Button>
      </View>
      <SubjectGrid subjects={subjects} selectedId={selectedSubjectId} onSelect={setSelectedSubjectId} />
      <Card>
        <View style={styles.row}>
          <Text style={styles.section}>Tasks</Text>
          <Button onPress={() => setTaskModal(true)}>Add Task</Button>
        </View>
        <TaskList tasks={tasks} onToggle={id => toggleTask.mutate(id)} onDelete={id => deleteTask.mutate(id)} />
      </Card>

      <Modal visible={taskModal} transparent animationType="slide">
        <View style={styles.modal}><Card><Text style={styles.section}>New Task</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Task title" /><Button onPress={submitTask}>Save Task</Button><Button variant="ghost" onPress={() => setTaskModal(false)}>Cancel</Button></Card></View>
      </Modal>
      <Modal visible={subjectModal} transparent animationType="slide">
        <View style={styles.modal}><Card><Text style={styles.section}>New Subject</Text><TextInput style={styles.input} value={subjectName} onChangeText={setSubjectName} placeholder="Subject name" /><Button onPress={submitSubject}>Save Subject</Button><Button variant="ghost" onPress={() => setSubjectModal(false)}>Cancel</Button></Card></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 18, paddingBottom: 110},
  greeting: {fontSize: 26, fontWeight: '900', color: Colors.dark},
  section: {fontSize: 18, fontWeight: '900', color: Colors.dark},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  input: {borderWidth: 1, borderColor: Colors.softBorder, borderRadius: 14, padding: 12, marginVertical: 12},
  modal: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 18},
});
