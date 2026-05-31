import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '@/constants/colors';

export function Badge({label}: {label: string}) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {backgroundColor: Colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5},
  text: {fontSize: 11, fontWeight: '900', color: Colors.primary},
});
