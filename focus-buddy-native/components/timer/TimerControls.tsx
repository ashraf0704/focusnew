import {StyleSheet, Text, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Colors} from '@/constants/colors';

export function TimerControls({minutes, onMinutesChange}: {minutes: number; onMinutesChange: (minutes: number) => void}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Duration</Text>
      <Picker selectedValue={minutes} onValueChange={onMinutesChange} style={styles.picker}>
        {[5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map(value => (
          <Picker.Item key={value} label={`${value} minutes`} value={value} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {backgroundColor: Colors.white, borderRadius: 18, borderWidth: 1, borderColor: Colors.softBorder},
  label: {paddingHorizontal: 16, paddingTop: 12, fontWeight: '900', color: Colors.dark},
  picker: {color: Colors.dark},
});
