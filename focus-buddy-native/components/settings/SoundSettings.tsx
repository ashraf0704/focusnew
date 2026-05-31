import {StyleSheet, Text, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Colors} from '@/constants/colors';

export function SoundSettings({tone, volume, onToneChange, onVolumeChange}: {tone: string; volume: number; onToneChange: (tone: string) => void; onVolumeChange: (volume: number) => void}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Alarm tone</Text>
      <Picker selectedValue={tone} onValueChange={onToneChange}>
        {['classic-bell', 'singing-bowl', 'digital-chime', 'birdsong', 'ocean-wave'].map(item => <Picker.Item key={item} label={item} value={item} />)}
      </Picker>
      <Text style={styles.label}>Volume: {volume}%</Text>
      <Picker selectedValue={volume} onValueChange={onVolumeChange}>
        {[25, 50, 75, 100].map(item => <Picker.Item key={item} label={`${item}%`} value={item} />)}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.softBorder},
  label: {fontWeight: '900', color: Colors.dark, paddingHorizontal: 14, paddingTop: 12},
});
