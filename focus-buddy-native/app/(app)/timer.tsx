import {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {router} from 'expo-router';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ModeSelector} from '@/components/timer/ModeSelector';
import {SoundPicker} from '@/components/timer/SoundPicker';
import {TimerControls} from '@/components/timer/TimerControls';
import {Colors} from '@/constants/colors';
import {useAppStore} from '@/store/appStore';
import {TimerMode} from '@/types';

export default function TimerScreen() {
  const {subjects, selectedSubjectId, setSelectedSubjectId} = useAppStore();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [minutes, setMinutes] = useState(25);
  const [sound, setSound] = useState('off');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Focus Timer</Text>
      <ModeSelector mode={mode} onChange={setMode} />
      <TimerControls minutes={minutes} onMinutesChange={setMinutes} />
      <Card>
        <Text style={styles.label}>Subject</Text>
        <Picker selectedValue={selectedSubjectId} onValueChange={setSelectedSubjectId}>
          {subjects.map(subject => <Picker.Item key={subject.id} label={subject.name} value={subject.id} />)}
        </Picker>
      </Card>
      <View><Text style={styles.label}>Ambient sound</Text><SoundPicker value={sound} onChange={setSound} /></View>
      <Button onPress={() => router.push({pathname: '/focus-session', params: {minutes, mode, sound, subjectId: selectedSubjectId}})}>Start Session</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 18, paddingBottom: 110},
  title: {fontSize: 28, fontWeight: '900', color: Colors.dark},
  label: {fontWeight: '900', color: Colors.dark, marginBottom: 8},
});
