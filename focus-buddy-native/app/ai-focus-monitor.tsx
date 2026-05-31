import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import {Button} from '@/components/ui/Button';
import {Colors} from '@/constants/colors';

export default function AIFocusMonitorScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [running, setRunning] = useState(false);
  const [alert, setAlert] = useState<'none' | 'eyes_closed_3s' | 'rapid_blinking'>('none');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const event = Math.random();
      if (event > 0.86) trigger('eyes_closed_3s');
      if (event < 0.08) trigger('rapid_blinking');
    }, 1600);
    return () => clearInterval(interval);
  }, [running]);

  function trigger(type: 'eyes_closed_3s' | 'rapid_blinking') {
    setAlert(type);
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${type.replaceAll('_', ' ')} detected`, ...prev].slice(0, 20));
  }

  if (!permission?.granted) {
    return <View style={styles.center}><Text style={styles.title}>Camera permission required</Text><Button onPress={requestPermission}>Grant Permission</Button></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>KameraShield AI Monitor</Text>
      <CameraView facing="front" style={styles.camera} />
      {alert !== 'none' && <View style={styles.alert}><Text style={styles.alertText}>{alert === 'eyes_closed_3s' ? 'Eyes closed too long' : 'Rapid blinking detected'}</Text></View>}
      <View style={styles.row}><Button onPress={() => setRunning(!running)}>{running ? 'Stop' : 'Start'}</Button><Button variant="ghost" onPress={() => trigger('eyes_closed_3s')}>Simulate Closed</Button><Button variant="ghost" onPress={() => trigger('rapid_blinking')}>Simulate Blink</Button></View>
      {logs.map(log => <Text key={log} style={styles.log}>{log}</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 14},
  center: {flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12},
  title: {fontSize: 24, fontWeight: '900', color: Colors.dark},
  camera: {height: 340, borderRadius: 22, overflow: 'hidden'},
  row: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  alert: {backgroundColor: '#FEE2E2', borderRadius: 16, padding: 14},
  alertText: {color: '#991B1B', fontWeight: '900'},
  log: {padding: 10, backgroundColor: Colors.white, borderRadius: 12, color: Colors.dark},
});
